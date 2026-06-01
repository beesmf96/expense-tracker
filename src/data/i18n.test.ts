import { describe, it, expect, afterEach } from 'vitest'
import { freqLabel } from './i18n'
import { lang } from '../state/store'

afterEach(() => {
  lang.value = 'en'
})

describe('freqLabel', () => {
  it('returns English label for a known freq when lang is en', () => {
    lang.value = 'en'
    expect(freqLabel('monthly')).toBe('Monthly')
    expect(freqLabel('quarterly')).toBe('Quarterly')
    expect(freqLabel('biannual')).toBe('Biannual')
    expect(freqLabel('yearly')).toBe('Yearly')
  })

  it('returns Chinese label for a known freq when lang is zh', () => {
    lang.value = 'zh'
    expect(freqLabel('monthly')).toBe('每月')
    expect(freqLabel('quarterly')).toBe('每季度')
    expect(freqLabel('biannual')).toBe('每半年')
    expect(freqLabel('yearly')).toBe('每年')
  })

  it('returns the original string for an unknown freq value', () => {
    lang.value = 'en'
    expect(freqLabel('none')).toBe('none')
    expect(freqLabel('unknown')).toBe('unknown')
    expect(freqLabel('')).toBe('')
  })

  it('falls back to the original string for an unknown freq when lang is zh', () => {
    lang.value = 'zh'
    expect(freqLabel('none')).toBe('none')
  })

  it('lang switch is reactive — same call returns different result after lang changes', () => {
    lang.value = 'en'
    expect(freqLabel('monthly')).toBe('Monthly')
    lang.value = 'zh'
    expect(freqLabel('monthly')).toBe('每月')
  })
})
