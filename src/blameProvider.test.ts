import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as cp from 'child_process'
import { BlameProvider } from './blameProvider'

vi.mock('child_process')

// git blame --porcelain 的真实输出样本
const PORCELAIN_OUTPUT = `a3f9c12abc1234567890abcdef1234567890abcd 1 1 1
author 张三
author-mail <zhangsan@company.com>
author-time 1704691200
author-tz +0800
committer 张三
committer-time 1704691200
committer-tz +0800
summary fix: 修复登录逻辑空指针问题
filename src/user.ts
\tconst user = getUser(id)
0000000000000000000000000000000000000000 2 2 1
author Not Committed Yet
author-mail <not.committed.yet>
author-time 1704700000
author-tz +0800
committer Not Committed Yet
committer-mail <not.committed.yet>
committer-time 1704700000
committer-tz +0800
summary Version of src/user.ts
filename src/user.ts
\treturn user.name
`

function mockSpawn(stdout: string) {
  const emitter = {
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn(),
  }
  vi.mocked(cp.spawn).mockReturnValue(emitter as unknown as cp.ChildProcess)

  // 触发 stdout data 和 close
  emitter.stdout.on.mockImplementation((event: string, cb: (d: Buffer) => void) => {
    if (event === 'data') cb(Buffer.from(stdout))
  })
  emitter.stderr.on.mockImplementation(() => {})
  emitter.on.mockImplementation((event: string, cb: (code: number) => void) => {
    if (event === 'close') cb(0)
  })
}

describe('BlameProvider', () => {
  let provider: BlameProvider

  beforeEach(() => {
    provider = new BlameProvider()
    vi.clearAllMocks()
  })

  it('解析第 1 行：返回正确的 BlameInfo', async () => {
    mockSpawn(PORCELAIN_OUTPUT)
    const result = await provider.getBlameForFile('/repo/src/user.ts', '/repo')
    const line1 = result?.get(1)
    expect(line1).toBeDefined()
    expect(line1?.author).toBe('张三')
    expect(line1?.summary).toBe('fix: 修复登录逻辑空指针问题')
    expect(line1?.hash).toBe('a3f9c12abc1234567890abcdef1234567890abcd')
    expect(line1?.isUncommitted).toBe(false)
  })

  it('解析第 2 行：未提交行 isUncommitted 为 true', async () => {
    mockSpawn(PORCELAIN_OUTPUT)
    const result = await provider.getBlameForFile('/repo/src/user.ts', '/repo')
    const line2 = result?.get(2)
    expect(line2?.isUncommitted).toBe(true)
  })

  it('git 命令失败时返回 null', async () => {
    const emitter = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
    }
    vi.mocked(cp.spawn).mockReturnValue(emitter as unknown as cp.ChildProcess)
    emitter.stdout.on.mockImplementation(() => {})
    emitter.stderr.on.mockImplementation(() => {})
    emitter.on.mockImplementation((event: string, cb: (code: number) => void) => {
      if (event === 'close') cb(128)  // git error exit code
    })

    const result = await provider.getBlameForFile('/not-a-repo/file.ts', '/not-a-repo')
    expect(result).toBeNull()
  })

  it('相同文件第二次调用使用缓存（spawn 只调用一次）', async () => {
    mockSpawn(PORCELAIN_OUTPUT)
    await provider.getBlameForFile('/repo/src/user.ts', '/repo')
    await provider.getBlameForFile('/repo/src/user.ts', '/repo')
    expect(cp.spawn).toHaveBeenCalledTimes(1)
  })

  it('invalidate 后再次调用会重新执行 git blame', async () => {
    mockSpawn(PORCELAIN_OUTPUT)
    await provider.getBlameForFile('/repo/src/user.ts', '/repo')
    provider.invalidate('/repo/src/user.ts')
    await provider.getBlameForFile('/repo/src/user.ts', '/repo')
    expect(cp.spawn).toHaveBeenCalledTimes(2)
  })
})
