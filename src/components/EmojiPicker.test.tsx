import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/preact'
import userEvent from '@testing-library/user-event'
import { EmojiPicker } from './EmojiPicker'

describe('EmojiPicker', () => {
  it('renders the Money tab active by default', () => {
    render(<EmojiPicker selectedEmoji="" onSelect={vi.fn()} />)
    const moneyTab = screen.getByRole('button', { name: /money/i })
    expect(moneyTab.classList.contains('active')).toBe(true)
  })

  it('renders emojis from the active (Money) group on initial render', () => {
    render(<EmojiPicker selectedEmoji="" onSelect={vi.fn()} />)
    expect(screen.getByText('💰')).toBeTruthy()
    expect(screen.queryByText('🍕')).toBeNull()
  })

  it('clicking a different tab switches the emoji grid', async () => {
    const user = userEvent.setup()
    render(<EmojiPicker selectedEmoji="" onSelect={vi.fn()} />)

    const foodTab = screen.getByRole('button', { name: /food/i })
    await user.click(foodTab)

    expect(screen.getByText('🍕')).toBeTruthy()
    expect(screen.queryByText('💰')).toBeNull()
  })

  it('clicking the Food tab marks it active and deactivates Money', async () => {
    const user = userEvent.setup()
    render(<EmojiPicker selectedEmoji="" onSelect={vi.fn()} />)

    const foodTab = screen.getByRole('button', { name: /food/i })
    await user.click(foodTab)

    expect(foodTab.classList.contains('active')).toBe(true)
    const moneyTab = screen.getByRole('button', { name: /money/i })
    expect(moneyTab.classList.contains('active')).toBe(false)
  })

  it('calls onSelect with the correct emoji when an emoji is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<EmojiPicker selectedEmoji="" onSelect={onSelect} />)

    await user.click(screen.getByText('💰'))

    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('💰')
  })

  it('applies the selected class to the selectedEmoji button', () => {
    render(<EmojiPicker selectedEmoji="💰" onSelect={vi.fn()} />)
    const emojiEl = screen.getByText('💰')
    expect(emojiEl.classList.contains('selected')).toBe(true)
  })

  it('does not apply selected class to an emoji that is not selectedEmoji', () => {
    render(<EmojiPicker selectedEmoji="💰" onSelect={vi.fn()} />)
    const emojiEl = screen.getByText('💳')
    expect(emojiEl.classList.contains('selected')).toBe(false)
  })

  it('shows selected class on selectedEmoji after switching to its tab', async () => {
    const user = userEvent.setup()
    render(<EmojiPicker selectedEmoji="🍕" onSelect={vi.fn()} />)

    expect(screen.queryByText('🍕')).toBeNull()

    await user.click(screen.getByRole('button', { name: /food/i }))

    const emojiEl = screen.getByText('🍕')
    expect(emojiEl.classList.contains('selected')).toBe(true)
  })
})
