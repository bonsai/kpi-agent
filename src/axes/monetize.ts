import type { Octokit } from '@octokit/rest'
import type { KpiConfig } from '../config.js'
import type { AxisResult } from './types.js'
import { fetchIssues } from '../github.js'

export async function measureMonetize(
  octokit: Octokit,
  owner: string,
  repo: string,
  config: KpiConfig
): Promise<AxisResult> {
  const label = config.labels.monetize
  const issues = await fetchIssues(octokit, owner, repo, label, 'open')

  if (issues.length === 0) {
    return {
      name: 'マネタイズ容易性',
      score: '未定義',
      status: 'gray',
      delta: '—',
      alert: `ラベル "${label}" の Issue なし`,
    }
  }

  const status = issues.length === 0 ? 'green' : 'yellow'

  return {
    name: 'マネタイズ容易性',
    score: `ブロッカー ${issues.length} 件`,
    status,
    delta: '—',
    alert: issues
      .slice(0, 3)
      .map((i) => `#${i.number}`)
      .join(', '),
  }
}
