import { customAlphabet } from 'nanoid'

// THIS IS FOR COPILOT
export const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7,
) // 7-character random string

export function formatTimeToNow(dateInput: string | Date): string {
  const date = new Date(dateInput)
  const now = new Date()

  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 1) return 'today'
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 30) return `${diffDays} days ago`

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths === 1) return '1 month ago'
  return `${diffMonths} months ago`
}

export function getMonthRange(
  period: 'this-month' | 'last-month' | 'last-2-month',
) {
  const now = new Date()

  // Base date always starts from current month
  const base = new Date(now.getFullYear(), now.getMonth(), 1)

  let offset = 0

  if (period === 'last-month') offset = -1
  if (period === 'last-2-month') offset = -2

  const startDate = new Date(base.getFullYear(), base.getMonth() + offset, 1)

  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1)

  const timeLabel = startDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  })

  return { startDate, endDate, timeLabel }
}

export function getLastTwoMonthRanges() {
  const now = new Date()

  const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const startNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  return {
    startLastMonth,
    startThisMonth,
    endThisMonth: startNextMonth,
  }
}

export function extractJson(text: string) {
  // Remove ```json ... ``` or ``` ... ```
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  return JSON.parse(cleaned)
}
