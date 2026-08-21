import { useRef, useState } from 'react'

const STEP_MS = 550

// Animates through a scenario's steps at a fixed demo pace (not real time —
// real durations are shown alongside each step, but waiting the literal
// sum, often 60-90s, would make for a bad demo). Stops at the first step
// flagged `fails: true` and reports that outcome explicitly.
export function useScenarioRunner() {
  const [steps, setSteps] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [status, setStatus] = useState('idle') // idle | running | done
  const [outcome, setOutcome] = useState(null) // 'success' | 'blocked' | 'rolled_back'
  const timeoutRef = useRef(null)

  function advance(scenario, index) {
    if (index >= scenario.steps.length) {
      setStatus('done')
      setOutcome(scenario.outcome)
      return
    }
    setCurrentIndex(index)
    const step = scenario.steps[index]
    timeoutRef.current = setTimeout(
      () => advance(scenario, index + 1),
      step.fails ? STEP_MS * 1.6 : STEP_MS,
    )
  }

  function run(scenario) {
    clearTimeout(timeoutRef.current)
    setSteps(scenario.steps)
    setStatus('running')
    setOutcome(null)
    advance(scenario, 0)
  }

  function reset() {
    clearTimeout(timeoutRef.current)
    setSteps([])
    setCurrentIndex(-1)
    setStatus('idle')
    setOutcome(null)
  }

  return { steps, currentIndex, status, outcome, run, reset }
}
