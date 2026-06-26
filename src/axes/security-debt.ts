import type { Octokit } from '@octokit/rest'
import type { KpiConfig } from '../config.js'
import type { AxisResult } from './types.js'
import { fetchIssues } from '../github.js'

export async function measureSecurityDebt(
  octokit: Octokit,
  owner: string,
  repo: string,
  config: KpiConfig
): Promise<AxisResult> {
  const secLabel = config.labels.security
  const critLabel = config.labels.critical
  const majorLabel = config.labels.major

  const [critSec, majorSec, allSec] = await Promise.all([
    fetchIssues(octokit, owner, repo, `${secLabel},${critLabel}`, 'open'),
    fetchIssues(octokit, owner, repo, `${secLabel},${majorLabel}`, 'open'),
    fetchIssues(octokit, owner, repo, secLabel, 'open'),
  ])

  const critCount = critSec.length
  const majorCount = majorSec.length
  const totalCount = allSec.length

  const status = critCount > 0 ? 'red' : majorCount > 0 ? 'yellow' : 'green'

  const alert =
    critCount > 0
      ? `CRITICAL ${critCount} 件: ${critSec.map((i) => `#${i.number}`).join(', ')}`
      : majorCount > 0
        ? `MAJOR ${majorCount} 件: ${majorSec.map((i) => `#${i.number}`).join(', ')}`
        : '—'

  return {
    name: 'セキュリティ負債',
    score:
      totalCount === 0
        ? '0 件'
        : `${totalCount} 件 (CRITICAL: ${critCount}, MAJOR: ${majorCount})`,
    status,
    delta: '—',
    alert,
  }
}
