import * as vscode from 'vscode'
import type { Config } from './types'

export class ConfigManager {
  private readonly section = 'gitblame'

  get(): Config {
    const cfg = vscode.workspace.getConfiguration(this.section)
    return {
      inlineAnnotationEnabled: cfg.get<boolean>('inlineAnnotation.enabled', true),
      inlineAnnotationFormat: cfg.get<string>('inlineAnnotation.format', '${author}, ${timeAgo} · ${summary}'),
      hoverTooltipEnabled: cfg.get<boolean>('hoverTooltip.enabled', false),
    }
  }

  onChange(handler: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration(this.section)) handler()
    })
  }
}
