// Sends the current PR diff to the Gemini free-tier API and posts the
// review back as a PR comment. Designed to run in GitHub Actions with
// GEMINI_API_KEY, GITHUB_TOKEN, PR_NUMBER, REPO and DIFF_FILE set as env vars.
import { readFileSync } from 'node:fs'

const MAX_DIFF_CHARS = 60_000 // keep the prompt within the free-tier context budget

const { GEMINI_API_KEY, GITHUB_TOKEN, PR_NUMBER, REPO, DIFF_FILE = '/tmp/pr.diff' } = process.env

function fail(message) {
  console.error(`[ai-review] ${message}`)
  process.exit(0) // never fail the pipeline on review-bot problems
}

if (!GEMINI_API_KEY) fail('GEMINI_API_KEY is not set — skipping AI review.')
if (!GITHUB_TOKEN || !PR_NUMBER || !REPO) fail('Missing GitHub context — skipping AI review.')

let diff
try {
  diff = readFileSync(DIFF_FILE, 'utf8')
} catch {
  fail(`Could not read diff file at ${DIFF_FILE}`)
}

if (!diff.trim()) fail('Empty diff — nothing to review.')
if (diff.length > MAX_DIFF_CHARS) diff = diff.slice(0, MAX_DIFF_CHARS) + '\n... (diff truncated)'

const prompt = `You are an automated code reviewer for a CI/CD pipeline. Review the
following unified git diff. Focus on correctness bugs, security issues, and
clear anti-patterns — skip style nitpicks. Reply in concise markdown with a
short bullet list of findings (max 6), or "No significant issues found." if
the diff looks fine.

\`\`\`diff
${diff}
\`\`\``

async function callGemini() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  })

  if (!res.ok) {
    throw new Error(`Gemini API error ${res.status}: ${await res.text()}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No review text returned.'
}

async function postComment(body) {
  const url = `https://api.github.com/repos/${REPO}/issues/${PR_NUMBER}/comments`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      body: `### 🤖 AI code review (Gemini)\n\n${body}`,
    }),
  })

  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${await res.text()}`)
  }
}

try {
  const review = await callGemini()
  await postComment(review)
  console.log('[ai-review] Posted review comment successfully.')
} catch (err) {
  fail(err.message)
}
