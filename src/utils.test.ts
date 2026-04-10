import { describe, it, expect } from 'vitest'
import { formatTimeAgo, formatAnnotation } from './utils'
import type { BlameInfo } from './types'

const NOW = 1704780000 // 2024-01-09 16:00:00

describe('formatTimeAgo', () => {
  it('刚刚（60秒内）', () => {
    expect(formatTimeAgo(NOW - 30, NOW)).toBe('刚刚')
  })

  it('N 分钟前', () => {
    expect(formatTimeAgo(NOW - 300, NOW)).toBe('5分钟前')
  })

  it('N 小时前', () => {
    expect(formatTimeAgo(NOW - 7200, NOW)).toBe('2小时前')
  })

  it('N 天前', () => {
    expect(formatTimeAgo(NOW - 86400 * 3, NOW)).toBe('3天前')
  })

  it('N 个月前', () => {
    expect(formatTimeAgo(NOW - 86400 * 40, NOW)).toBe('1个月前')
  })

  it('N 年前', () => {
    expect(formatTimeAgo(NOW - 86400 * 400, NOW)).toBe('1年前')
  })
})

describe('formatAnnotation', () => {
  const info: BlameInfo = {
    hash: 'a3f9c12',
    author: '张三',
    authorMail: 'zhangsan@co.com',
    authorTime: NOW - 86400 * 2,
    authorTz: '+0800',
    summary: 'fix: 修复登录逻辑',
    filename: 'src/user.ts',
    isUncommitted: false,
  }

  it('替换 ${author}', () => {
    expect(formatAnnotation('${author}', info, NOW)).toBe('张三')
  })

  it('替换 ${timeAgo}', () => {
    expect(formatAnnotation('${timeAgo}', info, NOW)).toBe('2天前')
  })

  it('替换 ${summary}', () => {
    expect(formatAnnotation('${summary}', info, NOW)).toBe('fix: 修复登录逻辑')
  })

  it('替换 ${hash} 取前 7 位', () => {
    expect(formatAnnotation('${hash}', info, NOW)).toBe('a3f9c12')
  })

  it('完整模板替换', () => {
    const result = formatAnnotation('${author}, ${timeAgo} · ${summary}', info, NOW)
    expect(result).toBe('张三, 2天前 · fix: 修复登录逻辑')
  })

  it('未提交行返回固定文字', () => {
    const uncommitted = { ...info, isUncommitted: true }
    expect(formatAnnotation('${author}, ${timeAgo}', uncommitted, NOW)).toBe('未提交')
  })
})
