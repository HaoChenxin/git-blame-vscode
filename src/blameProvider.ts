import { spawn } from 'child_process'
import type { BlameInfo, BlameMap } from './types'

// ============================================================
//  常量区
// ============================================================

const UNCOMMITTED_HASH = '0000000000000000000000000000000000000000'

// ============================================================
//  核心实现：BlameProvider
//  职责：调用 git blame --porcelain，解析输出，缓存结果
// ============================================================

export class BlameProvider {
  // key: 文件绝对路径
  private cache = new Map<string, BlameMap>()

  async getBlameForFile(filePath: string, repoRoot: string): Promise<BlameMap | null> {
    if (this.cache.has(filePath)) return this.cache.get(filePath)!

    const result = await this.runBlame(filePath, repoRoot)
    if (result) this.cache.set(filePath, result)
    return result
  }

  invalidate(filePath: string): void {
    this.cache.delete(filePath)
  }

  // ----------------------------------------------------------
  //  私有：执行 git blame 子进程
  // ----------------------------------------------------------

  private runBlame(filePath: string, repoRoot: string): Promise<BlameMap | null> {
    return new Promise(resolve => {
      const proc = spawn('git', ['blame', '--porcelain', filePath], { cwd: repoRoot })
      let output = ''

      proc.stdout.on('data', (chunk: Buffer) => { output += chunk.toString() })
      proc.stderr.on('data', () => {})
      proc.on('close', (code: number) => {
        if (code !== 0) { resolve(null); return }
        resolve(this.parse(output))
      })
    })
  }

  // ----------------------------------------------------------
  //  私有：解析 porcelain 格式
  //  格式：<hash> <orig-line> <final-line> [<num-lines>]
  //        key: value ...（若干元数据行）
  //        \t<代码行>
  // ----------------------------------------------------------

  private parse(output: string): BlameMap {
    const map: BlameMap = new Map()
    const lines = output.split('\n')
    let i = 0

    while (i < lines.length) {
      const header = lines[i]
      if (header.startsWith('\t')) { i++; continue }

      // 行头格式: <hash> <orig-line> <final-line> [<num-lines>]
      const headerMatch = header.match(/^([0-9a-f]{40}) \d+ (\d+)/)
      if (!headerMatch) { i++; continue }

      const hash = headerMatch[1]
      const finalLine = parseInt(headerMatch[2], 10)

      const info: BlameInfo = {
        hash,
        isUncommitted: hash === UNCOMMITTED_HASH,
        author: '',
        authorMail: '',
        authorTime: 0,
        authorTz: '',
        summary: '',
        filename: '',
      }

      i++
      // 读取后续 key-value 行，直到遇到 \t 开头的代码行
      while (i < lines.length && !lines[i].startsWith('\t')) {
        const line = lines[i]
        if (line.startsWith('author '))          info.author = line.slice(7)
        else if (line.startsWith('author-mail ')) info.authorMail = line.slice(12).replace(/[<>]/g, '')
        else if (line.startsWith('author-time ')) info.authorTime = parseInt(line.slice(12), 10)
        else if (line.startsWith('author-tz '))   info.authorTz = line.slice(10)
        else if (line.startsWith('summary '))     info.summary = line.slice(8)
        else if (line.startsWith('filename '))    info.filename = line.slice(9)
        i++
      }
      i++ // 跳过 \t 开头的代码行

      map.set(finalLine, info)
    }

    return map
  }
}
