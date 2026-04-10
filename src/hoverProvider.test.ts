import { describe, it, expect, vi } from 'vitest'

vi.mock('vscode', () => ({
  languages: { registerHoverProvider: vi.fn(() => ({ dispose: vi.fn() })) },
  MarkdownString: class {
    value = ''
    isTrusted = false
    appendMarkdown(s: string) { this.value += s; return this }
  },
  Hover: class {
    constructor(public contents: unknown) {}
  },
}))

import { buildHoverContent } from './hoverProvider'
import type { BlameInfo } from './types'

const NOW = 1704780000

describe('buildHoverContent', () => {
  it('未提交行返回 null', () => {
    const info: BlameInfo = {
      hash: '0000000000000000000000000000000000000000',
      author: 'Not Committed Yet',
      authorMail: 'not.committed.yet',
      authorTime: NOW,
      authorTz: '+0800',
      summary: 'Version of src/user.ts',
      filename: 'src/user.ts',
      isUncommitted: true,
    }
    expect(buildHoverContent(info, NOW)).toBeNull()
  })

  it('包含 hash 前 7 位', () => {
    const info: BlameInfo = {
      hash: 'a3f9c12abc1234567890abcdef1234567890abcd',
      author: '张三',
      authorMail: 'zhangsan@co.com',
      authorTime: NOW - 172800,
      authorTz: '+0800',
      summary: 'fix: 修复登录逻辑空指针问题',
      filename: 'src/user.ts',
      isUncommitted: false,
    }
    const content = buildHoverContent(info, NOW)
    expect(content?.value).toContain('a3f9c12')
  })

  it('包含作者名和邮箱', () => {
    const info: BlameInfo = {
      hash: 'a3f9c12abc1234567890abcdef1234567890abcd',
      author: '张三',
      authorMail: 'zhangsan@co.com',
      authorTime: NOW - 172800,
      authorTz: '+0800',
      summary: 'fix: 修复登录逻辑空指针问题',
      filename: 'src/user.ts',
      isUncommitted: false,
    }
    const content = buildHoverContent(info, NOW)
    expect(content?.value).toContain('张三')
    expect(content?.value).toContain('zhangsan@co.com')
  })

  it('包含 summary', () => {
    const info: BlameInfo = {
      hash: 'a3f9c12abc1234567890abcdef1234567890abcd',
      author: '张三',
      authorMail: 'zhangsan@co.com',
      authorTime: NOW - 172800,
      authorTz: '+0800',
      summary: 'fix: 修复登录逻辑空指针问题',
      filename: 'src/user.ts',
      isUncommitted: false,
    }
    const content = buildHoverContent(info, NOW)
    expect(content?.value).toContain('fix: 修复登录逻辑空指针问题')
  })
})
