# Git Blame

免费的 VSCode 行内 Git Blame 注解插件，对标 GitLens 付费功能。

## 功能

**行尾虚影注解**（默认开启）

光标停在任意一行，行尾自动显示该行的提交信息：

```
const user = getUser(id)    张三, 2天前 · fix: 修复登录逻辑
```

**Hover 详情**（默认关闭）

鼠标悬停时弹出完整提交信息，包含作者、时间、commit message，以及跳转到完整 diff 的链接。

## 配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `gitblame.inlineAnnotation.enabled` | `true` | 开启/关闭行尾虚影注解 |
| `gitblame.inlineAnnotation.format` | `${author}, ${timeAgo} · ${summary}` | 注解格式模板 |
| `gitblame.hoverTooltip.enabled` | `false` | 开启/关闭 Hover 详情弹窗 |

### 格式模板变量

| 变量 | 说明 |
|------|------|
| `${author}` | 提交作者 |
| `${timeAgo}` | 相对时间（如"2天前"） |
| `${summary}` | 提交消息 |
| `${hash}` | 短 commit hash（7位） |

## 要求

- VSCode 1.85.0+
- 本地已安装 Git
