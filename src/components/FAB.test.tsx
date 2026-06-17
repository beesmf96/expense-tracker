import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/preact'
import { FAB } from './FAB'
import { activePage } from '../state/store'
import type { PageId } from '../types'

vi.mock('../state/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../state/store')>()
  return { ...actual, openM: vi.fn() }
})

describe('FAB', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each(['home', 'transactions', 'settings', 'manage-cats', 'search'] as PageId[])(
    'renders nothing on the %s page',
    (page) => {
      activePage.value = page
      const { container } = render(<FAB />)
      expect(container.firstChild).toBeNull()
    },
  )

  it('renders on the recurring page and opens the recurring modal', async () => {
    const { openM } = await import('../state/store')
    activePage.value = 'recurring'
    render(<FAB />)
    fireEvent.click(screen.getByLabelText('Add'))
    expect(openM).toHaveBeenCalledWith('recurring')
  })
})
