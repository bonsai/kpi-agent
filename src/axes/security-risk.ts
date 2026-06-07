import type { Octokit } from '@octokit/rest'
import type { KpiConfig } from '../config.js'
import type { AxisResult } from './types.js'

export async function measureSecurityRisk(
  octokit: Octokit,
  owner: string,
  repo: string,
  _config: KpiConfig
): Promise<AxisResult> {
  const results: string[] = []

  try {
    const searches = await Promise.allSettled([
      octokit.rest.search.code({
        q: `repo:${owner}/${repo} GITHUB_TOKEN=`,
        per_page: 5,
      }),
      octokit.rest.search.code({
        q: `repo:${owner}/${repo} sk- language:javascript OR language:typescript`,
        per_page: 5,
      }),
    ])

    for (const r of searches) {
      if (r.status === 'fulfilled' && r.value.data.total_count > 0) {
        results.push(`コード内 potential secret (${r.value.data.total_count} 件)`)
      }
    }
  } catch {
    // Search API 403 on some repos — skip
  }

  const status = results.length > 0 ? 'red' : 'green'

  return {
    name: 'セキュリティリスク',
    score: results.length === 0 ? 'リスク検出なし' : `${results.length} 件検出`,
    status,
    delta: '—',
    alert: results.length > 0 ? results.join(' / ') : '—',
  }
}
