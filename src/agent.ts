import { createOctokit, parseRepo, postIssueComment, createIssue } from './github.js'
import { measureReliability } from './axes/reliability.js'
import { measureUxQuality } from './axes/ux-quality.js'
import { measureVelocity } from './axes/velocity.js'
import { measureSecurityDebt } from './axes/security-debt.js'
import { measureSecurityRisk } from './axes/security-risk.js'
import { measureAxScore } from './axes/ax-score.js'
import { measureMonetize } from './axes/monetize.js'
import { formatMarkdown, formatJson } from './report/markdown.js'
import type { KpiConfig } from './config.js'
import type { AxisResult } from './axes/types.js'

export interface RunOptions {
  output: 'markdown' | 'json'
  comment: boolean
  issueNumber?: number
}

export class KpiAgent {
  private octokit
  private owner: string
  private repo: string

  constructor(private config: KpiConfig) {
    this.octokit = createOctokit(config.token)
    const parsed = parseRepo(config.repo)
    this.owner = parsed.owner
    this.repo = parsed.repo
  }

  async run(opts: RunOptions = { output: 'markdown', comment: false }): Promise<string> {
    const { owner, repo, config } = this
    console.error(`[kpi-agent] Scanning ${owner}/${repo}…`)

    const axesEnabled = config.axes
    const tasks: Promise<AxisResult>[] = []

    if (axesEnabled.reliability) tasks.push(measureReliability(this.octokit, owner, repo, config))
    if (axesEnabled.ux_quality) tasks.push(measureUxQuality(this.octokit, owner, repo, config))
    if (axesEnabled.velocity) tasks.push(measureVelocity(this.octokit, owner, repo, config))
    if (axesEnabled.security_debt) tasks.push(measureSecurityDebt(this.octokit, owner, repo, config))
    if (axesEnabled.ax_score) tasks.push(measureAxScore(this.octokit, owner, repo, config))
    if (axesEnabled.security_risk) tasks.push(measureSecurityRisk(this.octokit, owner, repo, config))
    if (axesEnabled.monetize) tasks.push(measureMonetize(this.octokit, owner, repo, config))

    const results = await Promise.all(tasks)

    const report =
      opts.output === 'json'
        ? formatJson(results)
        : formatMarkdown(config.repo, results)

    if (opts.comment) {
      await this.postReport(report, opts.issueNumber)
    }

    return report
  }

  private async postReport(body: string, issueNumber?: number) {
    const { owner, repo } = this

    if (issueNumber) {
      await postIssueComment(this.octokit, owner, repo, issueNumber, body)
      console.error(`[kpi-agent] Posted comment to #${issueNumber}`)
      return
    }

    const issue = await createIssue(
      this.octokit,
      owner,
      repo,
      `KPI スナップショット — ${new Date().toISOString().slice(0, 10)}`,
      body,
      ['kpi-report']
    )
    console.error(`[kpi-agent] Created issue #${issue.number}`)
  }
}
