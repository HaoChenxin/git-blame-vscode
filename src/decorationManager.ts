import * as vscode from 'vscode'
import type { BlameMap } from './types'
import type { ConfigManager } from './configManager'
import { formatAnnotation } from './utils'

/**
 * =============================================================================
 * DecorationManager - 行尾虚影注解渲染器
 * =============================================================================
 * 核心职责：
 * - 监听光标位置，动态渲染当前行的 blame 信息为虚影文本
 * - 根据配置启用/禁用注解显示
 * - 管理 VSCode TextEditorDecorationType 生命周期
 *
 * 设计哲学：
 * - 单一真相源：decorationType 对象全局唯一，避免内存泄漏
 * - 惰性清理：配置关闭或无 blame 时清空装饰，不主动删除
 * - 性能优先：仅渲染光标所在行，避免全文档装饰导致卡顿
 * =============================================================================
 */
export class DecorationManager {
  // ======================= 核心成员 =======================
  private decorationType = vscode.window.createTextEditorDecorationType({
    after: {
      margin: '0 0 0 4em',                                  // 距离代码 4em，避免遮挡
      color: new vscode.ThemeColor('editorCodeLens.foreground'), // 使用主题色，自动适配深色/浅色
    },
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen, // 区间行为：闭开，光标在行尾时不触发
  })

  constructor(private readonly config: ConfigManager) {}

  // ======================= 核心方法：更新装饰 =======================
  /**
   * 更新编辑器的行尾注解装饰
   * @param editor - 目标编辑器实例
   * @param blameMap - blame 数据映射表（行号 → BlameInfo）
   *
   * 逻辑分支消除设计：
   * - 配置关闭或 blameMap 为空时，统一执行清空操作（早期返回）
   * - 光标行无 blame 数据时，同样清空（避免残留旧装饰）
   * - 仅在有效数据存在时渲染，单一路径，无复杂分支
   */
  update(editor: vscode.TextEditor, blameMap: BlameMap | null): void {
    // =============== 防御性检查：无效输入统一清空 ===============
    if (!this.config.get().inlineAnnotationEnabled || !blameMap) {
      editor.setDecorations(this.decorationType, [])
      return
    }

    // =============== 定位光标行 blame 数据 ===============
    const cursor = editor.selection.active
    const lineNumber = cursor.line + 1  // VSCode 行号是 0-based，blame 是 1-based
    const info = blameMap.get(lineNumber)

    if (!info) {
      editor.setDecorations(this.decorationType, [])
      return
    }

    // =============== 格式化注解文本 ===============
    const text = formatAnnotation(this.config.get().inlineAnnotationFormat, info)

    // =============== 构造虚影装饰 ===============
    const range = new vscode.Range(
      cursor.line,
      Number.MAX_SAFE_INTEGER,  // 列号设为最大值，确保在行尾渲染
      cursor.line,
      Number.MAX_SAFE_INTEGER
    )

    editor.setDecorations(this.decorationType, [{
      range,
      renderOptions: {
        after: { contentText: `  ${text}` },  // 前置两空格，视觉分离
      },
    }])
  }

  // ======================= 辅助方法：清空装饰 =======================
  /**
   * 清空编辑器的所有行尾注解
   * 使用场景：切换文件、关闭功能、文档关闭
   */
  clear(editor: vscode.TextEditor): void {
    editor.setDecorations(this.decorationType, [])
  }

  // ======================= 生命周期管理 =======================
  /**
   * 释放资源，防止内存泄漏
   * 必须在扩展停用时调用
   */
  dispose(): void {
    this.decorationType.dispose()
  }
}
