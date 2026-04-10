import * as vscode from 'vscode'
import { BlameProvider } from './blameProvider'
import { ConfigManager } from './configManager'
import { DecorationManager } from './decorationManager'
import { HoverProvider } from './hoverProvider'
import { GitShowContentProvider, showCommitDiff } from './commitDetailView'

export function activate(context: vscode.ExtensionContext): void {
  const config = new ConfigManager()
  const blame = new BlameProvider()
  const decoration = new DecorationManager(config)
  const hover = new HoverProvider(blame, config)

  // 注册虚拟文件 URI provider（用于 diff 展示）
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider('git-blame-show', new GitShowContentProvider())
  )

  // 注册 hover provider
  hover.register()
  context.subscriptions.push({ dispose: () => hover.dispose() })
  context.subscriptions.push({ dispose: () => decoration.dispose() })

  // 注册点击命令：查看提交 diff
  context.subscriptions.push(
    vscode.commands.registerCommand('gitblame.showCommitDiff', async (args: { hash: string }) => {
      const editor = vscode.window.activeTextEditor
      if (!editor) return
      const repoRoot = vscode.workspace.getWorkspaceFolder(editor.document.uri)?.uri.fsPath
      if (!repoRoot) return
      await showCommitDiff(args.hash, repoRoot)
    })
  )

  // 更新当前编辑器的 decoration
  async function updateDecoration(editor: vscode.TextEditor | undefined): Promise<void> {
    if (!editor || editor.document.uri.scheme !== 'file') return
    const repoRoot = vscode.workspace.getWorkspaceFolder(editor.document.uri)?.uri.fsPath
    if (!repoRoot) return
    const blameMap = await blame.getBlameForFile(editor.document.uri.fsPath, repoRoot)
    decoration.update(editor, blameMap)
  }

  // 光标移动时刷新注解
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection(e => updateDecoration(e.textEditor))
  )

  // 文件保存后 invalidate 缓存并刷新
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(doc => {
      blame.invalidate(doc.uri.fsPath)
      updateDecoration(vscode.window.activeTextEditor)
    })
  )

  // 切换编辑器 tab 时刷新
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(updateDecoration)
  )

  // 配置变更时刷新
  context.subscriptions.push(
    config.onChange(() => updateDecoration(vscode.window.activeTextEditor))
  )

  // 初始化：为当前已打开的编辑器更新一次
  updateDecoration(vscode.window.activeTextEditor)
}

export function deactivate(): void {}
