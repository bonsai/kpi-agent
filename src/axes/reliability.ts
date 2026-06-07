import type { Octokit } from '@octokit/rest'
import type { KpiConfig } from '../config.js'
import type { AxisResult } from './types.js'
import { fetchWorkflowRuns } from '../github.js'

export async function measureReliability(
  octokit: Octokit,
  owner: string,
  repo: string,
  config: KpiConfig
): Promise<AxisResult> {
  const runs = await fetchWorkflowRuns(octokit, owner, repo, config.ci_workflow, 20)

  if (runs.length === 0) {
    return {
      name: '信頼性',
      score: '未計測',
      status: 'gray',
      delta: '—',
      alert: 'ワークフロー実行なし',
    }
  }

  const completed = runs.filter((r) => r.status === 'completed')
  const successes = completed.filter((r) => r.conclusion === 'success')
  const rate = completed.length > 0 ? successes.length / completed.length : 0
  const pct = Math.round(rate * 100)

  const target = config.targets.ci_green_rate
  const status = rate >= target ? 'green' : rate >= target - 0.2 ? 'yellow' : 'red'

  const consecutiveFails = (() => {
    let n = 0
    for (const r of completed) {
      if (r.conclusion !== 'success') n++
      else break
    }
    return n
  })()

  const alert =
    consecutiveFails >= 2
      ? `CI 失敗 ${consecutiveFails} 件連続`
      : consecutiveFails === 1
        ? 'CI 直近 1 件失敗'
        : '—'

  return {
    name: '信頼性',
    score: `${pct}% (${completed.length} run)`,
    status,
    delta: '—',
    alert,
  }
}
