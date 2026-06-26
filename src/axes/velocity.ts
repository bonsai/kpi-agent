import type { Octokit } from '@octokit/rest'
import type { KpiConfig } from '../config.js'
import type { AxisResult } from './types.js'
import { fetchWorkflowRuns } from '../github.js'

function medianDays(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
    : (sorted[mid] ?? 0)
}

export async function measureVelocity(
  octokit: Octokit,
  owner: string,
  repo: string,
  config: KpiConfig
): Promise<AxisResult> {
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const closedIssues = await octokit.paginate(octokit.rest.issues.listForRepo, {
    owner,
    repo,
    state: 'closed',
    since: since.toISOString(),
    per_page: 100,
  })

  const issues = closedIssues.filter((i) => !i.pull_request && i.closed_at)

  const ttfs = issues.map((i) => {
    const opened = new Date(i.created_at).getTime()
    const closed = new Date(i.closed_at!).getTime()
    return (closed - opened) / (1000 * 60 * 60 * 24)
  })

  const runs = await fetchWorkflowRuns(octokit, owner, repo, config.ci_workflow, 10)
  const completed = runs.filter((r) => r.status === 'completed')
  const greenRate =
    completed.length > 0
      ? completed.filter((r) => r.conclusion === 'success').length / completed.length
      : null

  const ttfMedian = ttfs.length > 0 ? medianDays(ttfs) : null
  const target = config.targets.major_ttf_days

  const ttfStr =
    ttfMedian !== null ? `TTF ${ttfMedian.toFixed(1)} 日` : 'TTF 未計測'
  const greenStr =
    greenRate !== null ? `CI green ${Math.round(greenRate * 100)}%` : ''

  const status =
    ttfMedian === null
      ? 'gray'
      : ttfMedian <= target
        ? 'green'
        : ttfMedian <= target * 2
          ? 'yellow'
          : 'red'

  return {
    name: '開発速度',
    score: [ttfStr, greenStr].filter(Boolean).join(' / '),
    status,
    delta: '—',
    alert:
      ttfMedian !== null && ttfMedian > target
        ? `TTF 目標 ${target} 日超過`
        : '—',
  }
}
