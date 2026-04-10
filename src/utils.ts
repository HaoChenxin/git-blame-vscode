import type { BlameInfo } from './types'

/**
 * 时间相对显示：秒 → 刚刚 | 分钟 → N分钟前 | 小时 → N小时前 | 天 → N天前 | 月 → N个月前 | 年 → N年前
 */
export function formatTimeAgo(unixTime: number, now = Date.now() / 1000): string {
  const diff = Math.floor(now - unixTime)
  if (diff < 60)              return '刚刚'
  if (diff < 3600)            return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400)           return `${Math.floor(diff / 3600)}小时前`
  if (diff < 86400 * 30)      return `${Math.floor(diff / 86400)}天前`
  if (diff < 86400 * 365)     return `${Math.floor(diff / (86400 * 30))}个月前`
  return `${Math.floor(diff / (86400 * 365))}年前`
}

/**
 * 注解模板替换：${author} ${timeAgo} ${summary} ${hash}
 * 未提交行：返回固定文字"未提交"
 */
export function formatAnnotation(template: string, info: BlameInfo, now?: number): string {
  if (info.isUncommitted) return '未提交'
  return template
    .replace(/\$\{author\}/g, info.author)
    .replace(/\$\{timeAgo\}/g, formatTimeAgo(info.authorTime, now))
    .replace(/\$\{summary\}/g, info.summary)
    .replace(/\$\{hash\}/g, info.hash.slice(0, 7))
}
