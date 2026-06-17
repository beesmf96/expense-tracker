import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/preact'
import { BottomNav } from './BottomNav'
import { activePage, lang } from '../state/store'
import { t } from '../data/i18n'

describe('BottomNav', () => {
  beforeEach(() => {
    lang.value = 'en'
    activePage.value = 'home'
  })

  it('renders all five navigation buttons', () => {
    render(<BottomNav />)
    for (const key of ['home', 'records', 'recurring', 'search', 'settings'] as const) {
      expect(screen.getByText(t(key))).toBeTruthy()
    }
  })

  it('switches the active page when a button is clicked', () => {
    render(<BottomNav />)
    fireEvent.click(screen.getByText(t('recurring')))
    expect(activePage.value).toBe('recurring')
  })

  it('marks the current page button active', () => {
    activePage.value = 'search'
    render(<BottomNav />)
    expect(screen.getByText(t('search')).closest('.nav-btn')!.className).toContain('active')
  })

  it('treats manage-cats as the settings tab being active', () => {
    activePage.value = 'manage-cats'
    render(<BottomNav />)
    expect(screen.getByText(t('settings')).closest('.nav-btn')!.className).toContain('active')
  })
})
