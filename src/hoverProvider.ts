import * as vscode from 'vscode'
import type { BlameInfo } from './types'
import type { BlameProvider } from './blameProvider'
import type { ConfigManager } from './configManager'
import { formatTimeAgo } from './utils'

// 纯函数：构建 tooltip 内容，方便单测
export function buildHoverContent(info: BlameInfo, now?: number): vscode.MarkdownString | null {
  if (info.isUncommitted) return null

  const md = new vscode.MarkdownString()
  md.isTrusted = true

  const shortHash = info.hash.slice(0, 7)
  const timeAgo = formatTimeAgo(info.authorTime, now)
  const date = new Date(info.authorTime * 1000).toLocaleString('zh-CN')

  md.appendMarkdown(`\`${shortHash}\` **${info.author}** \<${info.authorMail}\>\n\n`)
  md.appendMarkdown(`${timeAgo} · ${date}\n\n`)
  md.appendMarkdown(`---\n\n`)
  md.appendMarkdown(`${info.summary}\n\n`)
  md.appendMarkdown(`[查看完整提交 →](command:gitblame.showCommitDiff?${encodeURIComponent(JSON.stringify({ hash: info.hash }))})`)

  return md
}

export class HoverProvider {
  private disposable: vscode.Disposable | null = null

  constructor(
    private readonly blameProvider: BlameProvider,
    private readonly config: ConfigManager,
  ) {}

  register(): void {
    this.disposable = vscode.languages.registerHoverProvider(
      { scheme: 'file' },
      {
        provideHover: async (document, position) => {
          if (!this.config.get().hoverTooltipEnabled) return null

          const repoRoot = vscode.workspace.getWorkspaceFolder(document.uri)?.uri.fsPath
          if (!repoRoot) return null

          const blameMap = await this.blameProvider.getBlameForFile(document.uri.fsPath, repoRoot)
          if (!blameMap) return null

          const info = blameMap.get(position.line + 1)
          if (!info) return null

          const content = buildHoverContent(info)
          return content ? new vscode.Hover(content) : null
        },
      }
    )
  }

  dispose(): void {
    this.disposable?.dispose()
  }
}
