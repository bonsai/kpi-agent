import type { Octokit } from '@octokit/rest'
import type { KpiConfig } from '../config.js'
import type { AxisResult } from './types.js'
import { fetchIssues } from '../github.js'

export async function measureUxQuality(
  octokit: Octokit,
  owner: string,
  repo: string,
  config: KpiConfig
): Promise<AxisResult> {
  const majorLabel = config.labels.major
  const uxLabel = config.labels.ux

  const [allUx, majorUx] = await Promise.all([
    fetchIssues(octokit, owner, repo, uxLabel, 'open'),
    fetchIssues(octokit, owner, repo, `${uxLabel},${majorLabel}`, 'open'),
  ])

  const count = allUx.length
  const majorCount = majorUx.length
  const status = count === 0 ? 'green' : majorCount > 0 ? 'red' : 'yellow'

  const alert =
    count === 0
      ? '—'
      : allUx
          .slice(0, 3)
          .map((i) => `#${i.number}`)
          .join(', ')

  return {
    name: '体験品質',
    score: `${count} 件未解決`,
    status,
    delta: '—',
    alert,
  }
}
