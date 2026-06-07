import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import yaml from 'js-yaml'

export interface KpiConfig {
  repo: string
  token: string
  labels: {
    ux: string
    security: string
    monetize: string
    critical: string
    major: string
  }
  targets: {
    ci_green_rate: number
    critical_ttf_hours: number
    major_ttf_days: number
    ax_score: number
    deploy_success_rate: number
    data_loss_per_month: number
  }
  ci_workflow?: string
  axes: {
    reliability: boolean
    ux_quality: boolean
    velocity: boolean
    security_debt: boolean
    ax_score: boolean
    security_risk: boolean
    monetize: boolean
  }
}

const defaults: Omit<KpiConfig, 'repo' | 'token'> = {
  labels: {
    ux: 'ux',
    security: 'security',
    monetize: 'monetize',
    critical: 'critical',
    major: 'major',
  },
  targets: {
    ci_green_rate: 0.95,
    critical_ttf_hours: 24,
    major_ttf_days: 7,
    ax_score: 0.8,
    deploy_success_rate: 1.0,
    data_loss_per_month: 0,
  },
  axes: {
    reliability: true,
    ux_quality: true,
    velocity: true,
    security_debt: true,
    ax_score: true,
    security_risk: true,
    monetize: true,
  },
}

export async function loadConfig(
  configPath: string,
  repoArg?: string
): Promise<KpiConfig> {
  let fileConfig: Partial<KpiConfig> = {}

  if (existsSync(configPath)) {
    const raw = await readFile(configPath, 'utf-8')
    fileConfig = yaml.load(raw) as Partial<KpiConfig>
  }

  const repo =
    repoArg ??
    fileConfig.repo ??
    process.env['GITHUB_REPOSITORY'] ??
    (() => {
      throw new Error(
        'Repository not specified. Use --repo owner/repo or set GITHUB_REPOSITORY.'
      )
    })()

  const token =
    process.env['GITHUB_TOKEN'] ??
    fileConfig.token ??
    (() => {
      throw new Error('GITHUB_TOKEN environment variable is required.')
    })()

  return {
    repo,
    token,
    labels: { ...defaults.labels, ...fileConfig.labels },
    targets: { ...defaults.targets, ...fileConfig.targets },
    ci_workflow: fileConfig.ci_workflow,
    axes: { ...defaults.axes, ...fileConfig.axes },
  }
}
