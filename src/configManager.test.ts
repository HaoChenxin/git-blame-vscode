import { describe, it, expect, vi, beforeEach } from 'vitest'

// mock vscode
vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vi.fn(),
    onDidChangeConfiguration: vi.fn(() => ({ dispose: vi.fn() })),
  },
}))

import * as vscode from 'vscode'
import { ConfigManager } from './configManager'

describe('ConfigManager', () => {
  beforeEach(() => {
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: (key: string) => {
        const defaults: Record<string, unknown> = {
          'inlineAnnotation.enabled': true,
          'inlineAnnotation.format': '${author}, ${timeAgo} · ${summary}',
          'hoverTooltip.enabled': false,
        }
        return defaults[key]
      },
    } as unknown as vscode.WorkspaceConfiguration)
  })

  it('读取 inlineAnnotationEnabled 默认为 true', () => {
    const cfg = new ConfigManager()
    expect(cfg.get().inlineAnnotationEnabled).toBe(true)
  })

  it('读取 hoverTooltipEnabled 默认为 false', () => {
    const cfg = new ConfigManager()
    expect(cfg.get().hoverTooltipEnabled).toBe(false)
  })

  it('读取 inlineAnnotationFormat 默认值正确', () => {
    const cfg = new ConfigManager()
    expect(cfg.get().inlineAnnotationFormat).toBe('${author}, ${timeAgo} · ${summary}')
  })
})
