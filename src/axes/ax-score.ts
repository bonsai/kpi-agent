import type { Octokit } from '@octokit/rest'
import type { KpiConfig } from '../config.js'
import type { AxisResult } from './types.js'

export async function measureAxScore(
  _octokit: Octokit,
  _owner: string,
  _repo: string,
  _config: KpiConfig
): Promise<AxisResult> {
  // AX Score requires session-level logging that GitHub API cannot provide.
  // Future: integrate with melon-chat session logs or custom webhook.
  return {
    name: 'エージェント効率',
    score: '未計測',
    status: 'gray',
    delta: '—',
    alert: '計測基盤未整備 (セッションログ連携が必要)',
  }
}
