import { useSignal } from '@preact/signals'
import { lang, activePage, openM, txs, userCats } from '../state/store'
import { t } from '../data/i18n'
import { exportCSV, backupJSON, loadBackupFile } from '../lib/exportHelpers'
import { allCats } from '../lib/catHelpers'
import { clearAll } from '../db/queries'
import type { Lang } from '../types'

export function Settings() {
  const dangerOpen = useSignal(false)
  function setLang(l: Lang) {
    lang.value = l
  }

  return (
    <div>
      <div class="page-title">{t('settings')}</div>

      <div class="settings-card">
        <div class="srow" onClick={() => { activePage.value = 'manage-cats' }}>
          <span class="srow-left">🏷️ {t('manageCats')}</span>
          <span style={{ color: 'var(--muted)', fontSize: '18px' }}>›</span>
        </div>
      </div>

      <div class="settings-card">
        <div class="srow" onClick={() => exportCSV(txs.value, allCats())}>
          <span class="srow-left">📤 {t('backup')}</span>
          <span style={{ color: 'var(--muted)', fontSize: '14px' }}>CSV</span>
        </div>
        <div class="srow" onClick={() => backupJSON(txs.value, userCats.value)}>
          <span class="srow-left">💾 {t('backup')}</span>
          <span style={{ color: 'var(--muted)', fontSize: '14px' }}>JSON</span>
        </div>
        <div class="srow" onClick={() => document.getElementById('restore-input')?.click()}>
          <span class="srow-left">📥 {t('restore')}</span>
          <input
            id="restore-input"
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={async e => {
              const file = (e.target as HTMLInputElement).files?.[0]
              if (!file) return
              try {
                await loadBackupFile(file)
              } catch {
                alert('Invalid backup file')
              }
              ;(e.target as HTMLInputElement).value = ''
            }}
          />
        </div>
      </div>

      <div class="settings-card">
        <div class="srow" style={{ cursor: 'default' }}>
          <span class="srow-left">🌐 {t('language')}</span>
          <div class="lang-toggle">
            <button class={`lang-btn${lang.value === 'zh' ? ' active' : ''}`} onClick={() => setLang('zh')}>中文</button>
            <button class={`lang-btn${lang.value === 'en' ? ' active' : ''}`} onClick={() => setLang('en')}>EN</button>
          </div>
        </div>
      </div>

      <div class={`settings-card danger-zone-card`}>
        <div class="srow" onClick={() => { dangerOpen.value = !dangerOpen.value }}>
          <span class="srow-left" style={{ color: 'var(--r)' }}>⚠️ {t('dangerZone')}</span>
          <span style={{ color: 'var(--r)', fontSize: '14px', transform: dangerOpen.value ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform .15s' }}>›</span>
        </div>
        {dangerOpen.value && (
          <div class="srow" onClick={() => openM('confirm', {
            confirmIcon: '🗑️',
            confirmTitle: t('confirmClear'),
            confirmMsg: 'This will permanently delete all transactions and categories.',
            confirmOkLabel: t('clearAll'),
            confirmOnOk: () => clearAll(),
          })}>
            <span class="srow-left" style={{ color: 'var(--r)' }}>🗑️ {t('clearAll')}</span>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', padding: '32px 0 8px', color: 'var(--muted)', fontSize: '12px' }}>
        MyLedger
      </div>
    </div>
  )
}
