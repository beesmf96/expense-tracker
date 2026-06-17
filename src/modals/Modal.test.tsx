import { describe, it, expect, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/preact'
import { Modal } from './Modal'
import { openModal, modalCtx } from '../state/store'

describe('Modal', () => {
  beforeEach(() => {
    openModal.value = 'confirm'
    modalCtx.value = {}
  })

  it('adds the open class when its id matches openModal', () => {
    const { container } = render(<Modal id="confirm"><div>body</div></Modal>)
    expect(container.querySelector('.overlay')!.className).toContain('open')
  })

  it('is not open when its id does not match', () => {
    const { container } = render(<Modal id="detail"><div>body</div></Modal>)
    expect(container.querySelector('.overlay')!.className).not.toContain('open')
  })

  it('closes when the backdrop is clicked', () => {
    const { container } = render(<Modal id="confirm"><div>body</div></Modal>)
    fireEvent.click(container.querySelector('.overlay')!)
    expect(openModal.value).toBeNull()
  })

  it('does not close when the inner modal content is clicked', () => {
    const { container } = render(<Modal id="confirm"><div>body</div></Modal>)
    fireEvent.click(container.querySelector('.modal')!)
    expect(openModal.value).toBe('confirm')
  })
})
