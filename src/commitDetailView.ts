import * as vscode from 'vscode'
import { execSync } from 'child_process'

export async function showCommitDiff(hash: string, repoRoot: string): Promise<void> {
  // 通过 git show 获取变更的文件列表
  let files: string[]
  try {
    const output = execSync(
      `git diff-tree --no-commit-id -r --name-only ${hash}`,
      { cwd: repoRoot, encoding: 'utf-8' }
    )
    files = output.trim().split('\n').filter(Boolean)
  } catch {
    vscode.window.showErrorMessage(`无法获取提交 ${hash.slice(0, 7)} 的变更文件`)
    return
  }

  if (files.length === 0) {
    vscode.window.showInformationMessage(`提交 ${hash.slice(0, 7)} 没有文件变更`)
    return
  }

  // 只展示第一个变更文件的 diff（最常见场景）
  const file = files[0]
  const beforeUri = vscode.Uri.parse(
    `git-blame-show:${hash}~1:${file}?hash=${hash}~1&path=${encodeURIComponent(file)}&root=${encodeURIComponent(repoRoot)}`
  )
  const afterUri = vscode.Uri.parse(
    `git-blame-show:${hash}:${file}?hash=${hash}&path=${encodeURIComponent(file)}&root=${encodeURIComponent(repoRoot)}`
  )

  await vscode.commands.executeCommand(
    'vscode.diff',
    beforeUri,
    afterUri,
    `${file} (${hash.slice(0, 7)})`
  )
}

// ContentProvider：为 git-blame-show:// URI 提供文件内容
export class GitShowContentProvider implements vscode.TextDocumentContentProvider {
  provideTextDocumentContent(uri: vscode.Uri): string {
    const params = new URLSearchParams(uri.query)
    const hash = params.get('hash') ?? ''
    const path = params.get('path') ?? ''
    const root = params.get('root') ?? ''

    if (!hash || !path || !root) return ''

    try {
      return execSync(`git show ${hash}:${path}`, { cwd: root, encoding: 'utf-8' })
    } catch {
      return ''  // 父提交不存在（首个提交的 ~1）时返回空
    }
  }
}
