import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/preact'
import { Toast } from './Toast'
import { toastMsg } from '../state/store'

describe('Toast', () => {
  beforeEach(() => {
    toastMsg.value = ''
  })

  it('is hidden (no visible class, no text) when there is no message', () => {
    const { container } = render(<Toast />)
    const el = container.firstChild as HTMLElement
    expect(el.className).not.toContain('toast-visible')
    expect(el.textContent).toBe('')
  })

  it('shows the message with the visible class when a message is set', () => {
    toastMsg.value = 'Saved!'
    render(<Toast />)
    const el = screen.getByText('Saved!')
    expect(el.className).toContain('toast-visible')
  })
})
