import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/preact'
import { App } from './App'
import { activePage, txs, userCats, lang } from './state/store'

describe('App', () => {
  beforeEach(() => {
    lang.value = 'en'
    txs.value = []
    userCats.value = []
    activePage.value = 'home'
  })

  it('marks the home page active by default', () => {
    const { container } = render(<App />)
    expect(container.querySelector('#page-home')!.className).toContain('active')
    expect(container.querySelector('#page-settings')!.className).not.toContain('active')
  })

  it('activates the page matching activePage', () => {
    activePage.value = 'settings'
    const { container } = render(<App />)
    expect(container.querySelector('#page-settings')!.className).toContain('active')
    expect(container.querySelector('#page-home')!.className).not.toContain('active')
  })
})
