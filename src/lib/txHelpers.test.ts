import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeTx, makeCat } from '../test-utils/setup'
import { lang } from '../state/store'

vi.mock('../state/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../state/store')>()
  return { ...actual, openM: vi.fn() }
})

vi.mock('../db/queries', () => ({
  delTx: vi.fn().mockResolvedValue(undefined),
}))

describe('confirmDeleteTx', () => {
  beforeEach(() => {
    lang.value = 'en'
    vi.clearAllMocks()
  })

  it('opens the confirm modal with delete context and the formatted amount', async () => {
    const { confirmDeleteTx } = await import('./txHelpers')
    const { openM } = await import('../state/store')
    confirmDeleteTx(makeTx({ id: 't1', amount: 12.5 }), makeCat())

    expect(openM).toHaveBeenCalledOnce()
    const [id, ctx] = vi.mocked(openM).mock.calls[0]
    expect(id).toBe('confirm')
    expect(ctx.confirmIcon).toBe('🗑️')
    expect(ctx.confirmMsg).toContain('12.50')
    expect(typeof ctx.confirmOnOk).toBe('function')
  })

  it('confirmOnOk deletes the transaction by id', async () => {
    const { confirmDeleteTx } = await import('./txHelpers')
    const { openM } = await import('../state/store')
    const { delTx } = await import('../db/queries')
    confirmDeleteTx(makeTx({ id: 't9' }), makeCat())

    const ctx = vi.mocked(openM).mock.calls[0][1]
    await ctx.confirmOnOk!()
    expect(delTx).toHaveBeenCalledWith('t9')
  })
})
