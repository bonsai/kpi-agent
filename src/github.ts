import { Octokit } from '@octokit/rest'

export function createOctokit(token: string): Octokit {
  return new Octokit({ auth: token })
}

export function parseRepo(repo: string): { owner: string; repo: string } {
  const [owner, name] = repo.split('/')
  if (!owner || !name) {
    throw new Error(`Invalid repo format: "${repo}". Expected "owner/repo".`)
  }
  return { owner, repo: name }
}

export async function fetchIssues(
  octokit: Octokit,
  owner: string,
  repo: string,
  label: string,
  state: 'open' | 'closed' | 'all' = 'open'
) {
  const issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
    owner,
    repo,
    labels: label,
    state,
    per_page: 100,
  })
  return issues.filter((i) => !i.pull_request)
}

export async function fetchWorkflowRuns(
  octokit: Octokit,
  owner: string,
  repo: string,
  workflowFile?: string,
  limit = 30
) {
  if (workflowFile) {
    const { data } = await octokit.rest.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: workflowFile,
      per_page: limit,
    })
    return data.workflow_runs
  }

  const { data } = await octokit.rest.actions.listWorkflowRunsForRepo({
    owner,
    repo,
    per_page: limit,
  })
  return data.workflow_runs
}

export async function postIssueComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
) {
  await octokit.rest.issues.createComment({ owner, repo, issue_number: issueNumber, body })
}

export async function createIssue(
  octokit: Octokit,
  owner: string,
  repo: string,
  title: string,
  body: string,
  labels: string[]
) {
  const { data } = await octokit.rest.issues.create({
    owner,
    repo,
    title,
    body,
    labels,
  })
  return data
}
