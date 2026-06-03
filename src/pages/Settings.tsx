import { useSignal } from '@preact/signals'
import { lang, theme, activePage, openM, txs, userCats, autoBackupFolderName, needsBackupPermission, showToast } from '../state/store'
import { t } from '../data/i18n'
import { exportCSV, backupJSON, writeAutoBackup } from '../lib/exportHelpers'
import { loadBackupFile } from '../lib/importHelpers'
import { allCats } from '../lib/catHelpers'
import { clearAll, saveAutoBackupHandle, clearAutoBackupHandle, grantAutoBackupPermission } from '../db/queries'
import type { Lang } from '../types'

export function Settings() {
  const dangerOpen = useSignal(false)
  const dataToolsOpen = useSignal(false)
  const permError = useSignal('')
  function setLang(l: Lang) {
    lang.value = l
  }

  async function pickFolder() {
    permError.value = ''
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
      await saveAutoBackupHandle(handle)
      await writeAutoBackup(handle, txs.value, userCats.value)
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') permError.value = e.message
    }
  }

  async function grantAccess() {
    permError.value = ''
    try {
      await grantAutoBackupPermission()
    } catch (e) {
      if (e instanceof Error) permError.value = e.message
    }
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
        <div class="srow" style={{ cursor: 'default' }}>
          <span class="srow-left">🌐 {t('language')}</span>
          <div class="lang-toggle">
            <button class={`lang-btn${lang.value === 'zh' ? ' active' : ''}`} onClick={() => setLang('zh')}>ZH</button>
            <button class={`lang-btn${lang.value === 'en' ? ' active' : ''}`} onClick={() => setLang('en')}>EN</button>
          </div>
        </div>
        <div class="srow" style={{ cursor: 'default' }}>
          <span class="srow-left">🎨 {t('appearance')}</span>
          <div class="lang-toggle">
            <button class={`lang-btn${theme.value === 'dark' ? ' active' : ''}`} aria-label={t('darkTheme')} onClick={() => { theme.value = 'dark' }}>🌙</button>
            <button class={`lang-btn${theme.value === 'light' ? ' active' : ''}`} aria-label={t('lightTheme')} onClick={() => { theme.value = 'light' }}>☀️</button>
          </div>
        </div>
      </div>

      {'showDirectoryPicker' in window && (
        <div class="settings-card">
          <div class="srow" style={{ cursor: 'default' }}>
            <span class="srow-left">📂 {t('autoBackup')}</span>
            <span style={{ color: 'var(--muted)', fontSize: '12px' }}>
              {autoBackupFolderName.value ?? t('folderNotSet')}
            </span>
          </div>
          <div class="srow auto-backup-actions" style={{ cursor: 'default' }}>
            <button class="btn-small btn-small-p" onClick={pickFolder}>{t('pickFolder')}</button>
            {needsBackupPermission.value && (
              <button class="btn-small btn-small-g" onClick={grantAccess}>{t('grantAccess')}</button>
            )}
            {autoBackupFolderName.value !== null && (
              <button class="btn-small btn-small-r" onClick={() => clearAutoBackupHandle()}>{t('clearFolder')}</button>
            )}
          </div>
          {permError.value !== '' && (
            <div class="srow" style={{ cursor: 'default', color: 'var(--r)', fontSize: '12px' }}>
              {permError.value}
            </div>
          )}
        </div>
      )}

      <div class="settings-card">
        <div class="srow" onClick={() => { dataToolsOpen.value = !dataToolsOpen.value }}>
          <span class="srow-left">🗂️ {t('dataTools')}</span>
          <span style={{ color: 'var(--muted)', fontSize: '14px', transform: dataToolsOpen.value ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform .15s' }}>›</span>
        </div>
        {dataToolsOpen.value && (<>
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
                  showToast(t('restored'))
                } catch {
                  alert('Invalid backup file')
                }
                ;(e.target as HTMLInputElement).value = ''
              }}
            />
          </div>
        </>)}
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
            confirmOnOk: () => clearAll().then(() => showToast(t('cleared'))),
          })}>
            <span class="srow-left" style={{ color: 'var(--r)' }}>🗑️ {t('clearAll')}</span>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', padding: '32px 0 8px', color: 'var(--muted)', fontSize: '12px' }}>
        {t('footer')} v{__APP_VERSION__}
      </div>
    </div>
  )
}
