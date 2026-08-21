// AI Pipeline Intelligence: sends the current PR diff to the Gemini
// free-tier API and gets back a structured review — not just prose
// comments, but a deployment-risk score, reasons, suggested tests, and a
// release recommendation. Posts the result as a PR comment. Designed to
// run in GitHub Actions with GEMINI_API_KEY, GITHUB_TOKEN, PR_NUMBER, REPO
// and DIFF_FILE set as env vars.
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

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING', description: 'One or two sentence overview of the change.' },
    findings: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Concrete correctness/security/anti-pattern findings, max 6. Empty if clean.',
    },
    riskScore: {
      type: 'INTEGER',
      description: '0-100 deployment risk score (0 = trivial, 100 = extremely risky).',
    },
    riskLevel: { type: 'STRING', enum: ['low', 'medium', 'high'] },
    reasons: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Short bullet reasons behind the risk score, max 5.',
    },
    recommendedTests: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Specific test cases worth running before merging, max 5.',
    },
    recommendation: {
      type: 'STRING',
      enum: ['auto_deploy', 'manual_approval', 'block'],
      description: 'auto_deploy for low risk, manual_approval for medium/high, block only for a severe correctness/security issue.',
    },
  },
  required: ['summary', 'findings', 'riskScore', 'riskLevel', 'reasons', 'recommendedTests', 'recommendation'],
}

const prompt = `You are an automated release-risk analyst for a CI/CD pipeline. Given the
unified git diff below, assess it like a staff engineer deciding whether it's
safe to auto-deploy. Consider: correctness bugs, security issues, blast
radius (does it touch auth/data/prod-critical paths?), and test coverage
signals visible in the diff itself. Be concise and concrete — no generic
advice.

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
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  })

  if (!res.ok) {
    throw new Error(`Gemini API error ${res.status}: ${await res.text()}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no content')
  return JSON.parse(text)
}

const RISK_BAR_LENGTH = 10
function riskBar(score) {
  const filled = Math.round((score / 100) * RISK_BAR_LENGTH)
  return '█'.repeat(filled) + '░'.repeat(RISK_BAR_LENGTH - filled)
}

const RECOMMENDATION_TEXT = {
  auto_deploy: '✅ Safe to auto-deploy',
  manual_approval: '⚠️ Manual approval required',
  block: '🛑 Blocking issue found — do not merge as-is',
}

function formatComment(review) {
  const { summary, findings, riskScore, riskLevel, reasons, recommendedTests, recommendation } = review

  const lines = [
    '### 🤖 AI Pipeline Intelligence (Gemini)',
    '',
    summary,
    '',
    '**AI Deployment Risk**',
    '```',
    `${riskBar(riskScore)}  ${riskScore}/100  ${riskLevel.toUpperCase()}`,
    '```',
  ]

  if (reasons?.length) {
    lines.push('', '**Reasons**', ...reasons.map((r) => `- ${r}`))
  }
  if (findings?.length) {
    lines.push('', '**Findings**', ...findings.map((f) => `- ${f}`))
  }
  if (recommendedTests?.length) {
    lines.push('', '**Suggested tests**', ...recommendedTests.map((t) => `- [ ] ${t}`))
  }

  lines.push('', `**Recommendation:** ${RECOMMENDATION_TEXT[recommendation] ?? recommendation}`)

  return lines.join('\n')
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
    body: JSON.stringify({ body }),
  })

  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${await res.text()}`)
  }
}

try {
  const review = await callGemini()
  await postComment(formatComment(review))
  console.log(`[ai-review] Posted review. risk=${review.riskScore} recommendation=${review.recommendation}`)
  if (review.recommendation === 'block') {
    console.error('[ai-review] AI flagged a blocking issue — review manually before merging.')
  }
} catch (err) {
  fail(err.message)
}
