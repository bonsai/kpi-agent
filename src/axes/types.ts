export type Status = 'green' | 'yellow' | 'red' | 'gray'

export interface AxisResult {
  name: string
  score: string
  status: Status
  delta: string
  alert: string
  details?: string
}

export const EMOJI: Record<Status, string> = {
  green: '🟢',
  yellow: '🟡',
  red: '🔴',
  gray: '⚪',
}
