import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/preact'
import { MonthNav } from './MonthNav'
import { viewY, viewM, lang } from '../state/store'

describe('MonthNav', () => {
  beforeEach(() => {
    lang.value = 'en'
    viewY.value = 2025
    viewM.value = 5
  })

  it('advances to the next month', () => {
    render(<MonthNav />)
    fireEvent.click(screen.getByText('›'))
    expect(viewM.value).toBe(6)
    expect(viewY.value).toBe(2025)
  })

  it('goes back to the previous month', () => {
    render(<MonthNav />)
    fireEvent.click(screen.getByText('‹'))
    expect(viewM.value).toBe(4)
  })

  it('wraps from December to next January', () => {
    viewM.value = 11
    render(<MonthNav />)
    fireEvent.click(screen.getByText('›'))
    expect(viewM.value).toBe(0)
    expect(viewY.value).toBe(2026)
  })

  it('wraps from January back to previous December', () => {
    viewM.value = 0
    render(<MonthNav />)
    fireEvent.click(screen.getByText('‹'))
    expect(viewM.value).toBe(11)
    expect(viewY.value).toBe(2024)
  })

  it('renders the formatted month label', () => {
    render(<MonthNav />)
    expect(screen.getByText(/2025/)).toBeTruthy()
  })
})
