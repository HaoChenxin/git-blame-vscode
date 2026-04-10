export interface BlameInfo {
  hash: string
  author: string
  authorMail: string
  authorTime: number   // Unix timestamp
  authorTz: string
  summary: string
  filename: string
  isUncommitted: boolean
}

// key: 1-based line number
export type BlameMap = Map<number, BlameInfo>

export interface Config {
  inlineAnnotationEnabled: boolean
  inlineAnnotationFormat: string
  hoverTooltipEnabled: boolean
}
