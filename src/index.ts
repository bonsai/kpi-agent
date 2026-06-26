#!/usr/bin/env node
import { Command } from 'commander'
import { loadConfig } from './config.js'
import { KpiAgent } from './agent.js'

const program = new Command()

program
  .name('kpi-agent')
  .description('General-purpose KPI measurement agent for GitHub repositories')
  .version('0.1.0')

program
  .command('scan')
  .description('Scan a repository and output a KPI snapshot')
  .option('-r, --repo <owner/repo>', 'Repository to scan (or set GITHUB_REPOSITORY)')
  .option('-c, --config <path>', 'Config file path', 'kpi.yml')
  .option('-o, --output <format>', 'Output format: markdown | json', 'markdown')
  .option('--comment', 'Post result as a GitHub Issue comment or new Issue')
  .option('--issue <number>', 'Issue number to comment on (requires --comment)', parseInt)
  .action(async (opts) => {
    try {
      const config = await loadConfig(opts.config, opts.repo)
      const agent = new KpiAgent(config)
      const report = await agent.run({
        output: opts.output === 'json' ? 'json' : 'markdown',
        comment: Boolean(opts.comment),
        issueNumber: opts.issue,
      })
      process.stdout.write(report + '\n')
    } catch (err) {
      console.error('[kpi-agent] Error:', (err as Error).message)
      process.exit(1)
    }
  })

program.parse()
