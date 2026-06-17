import type { ComponentChildren } from 'preact'
import { useSignal } from '@preact/signals'
import { lang, theme, activePage, openM, txs, userCats, autoBackupFolderName, needsBackupPermission, showToast, pinEnabled, swipeNav } from '../state/store'
import { t } from '../data/i18n'
import { exportCSV, backupJSON, writeAutoBackup } from '../lib/exportHelpers'
import { loadBackupFile } from '../lib/importHelpers'
import { allCats } from '../lib/catHelpers'
import { clearAll, saveAutoBackupHandle, clearAutoBackupHandle, grantAutoBackupPermission } from '../db/queries'
import type { Lang } from '../types'

interface ToggleBtnProps {
  active: boolean
  onClick: () => void
  label?: string
  children: ComponentChildren
}

function ToggleBtn({ active, onClick, label, children }: ToggleBtnProps) {
  return (
    <button class={`lang-btn${active ? ' active' : ''}`} aria-label={label} onClick={onClick}>
      {children}
    </button>
  )
}

function CategoriesCard() {
  return (
    <div class="settings-card">
      <div class="srow" onClick={() => { activePage.value = 'manage-cats' }}>
        <span class="srow-left">🏷️ {t('manageCats')}</span>
        <span style={{ color: 'var(--muted)', fontSize: '18px' }}>›</span>
      </div>
    </div>
  )
}

function PreferencesCard() {
  const setLang = (l: Lang) => { lang.value = l }
  return (
    <div class="settings-card">
      <div class="srow" style={{ cursor: 'default' }}>
        <span class="srow-left">🌐 {t('language')}</span>
        <div class="lang-toggle">
          <ToggleBtn active={lang.value === 'zh'} onClick={() => setLang('zh')}>ZH</ToggleBtn>
          <ToggleBtn active={lang.value === 'en'} onClick={() => setLang('en')}>EN</ToggleBtn>
        </div>
      </div>
      <div class="srow" style={{ cursor: 'default' }}>
        <span class="srow-left">🎨 {t('appearance')}</span>
        <div class="lang-toggle">
          <ToggleBtn active={theme.value === 'dark'} label={t('darkTheme')} onClick={() => { theme.value = 'dark' }}>🌙</ToggleBtn>
          <ToggleBtn active={theme.value === 'light'} label={t('lightTheme')} onClick={() => { theme.value = 'light' }}>☀️</ToggleBtn>
        </div>
      </div>
      <div class="srow" style={{ cursor: 'default' }}>
        <span class="srow-left">👆 {t('swipeNav')}</span>
        <div class="lang-toggle">
          <ToggleBtn active={swipeNav.value} onClick={() => { swipeNav.value = true }}>On</ToggleBtn>
          <ToggleBtn active={!swipeNav.value} onClick={() => { swipeNav.value = false }}>Off</ToggleBtn>
        </div>
      </div>
    </div>
  )
}

function AutoBackupCard() {
  const permError = useSignal('')

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
  )
}

function AppLockCard() {
  if (pinEnabled.value === false) {
    return (
      <div class="settings-card">
        <div class="srow" style={{ cursor: 'default' }}>
          <span class="srow-left">🔒 {t('appLock')}</span>
          <button class="btn-small btn-small-p" onClick={() => openM('pin-setup', { pinSetupMode: 'set' })}>{t('setPIN')}</button>
        </div>
      </div>
    )
  }
  return (
    <div class="settings-card">
      <div class="srow" style={{ cursor: 'default' }}>
        <span class="srow-left">🔒 {t('appLock')}</span>
        <span style={{ color: 'var(--g)', fontSize: '12px' }}>{t('lockOn')}</span>
      </div>
      <div class="srow" style={{ cursor: 'default' }}>
        <button class="btn-small btn-small-p" onClick={() => openM('pin-setup', { pinSetupMode: 'change' })}>{t('changePIN')}</button>
        <button class="btn-small btn-small-r" onClick={() => openM('pin-setup', { pinSetupMode: 'disable' })}>{t('disablePIN')}</button>
      </div>
    </div>
  )
}

function DataToolsCard() {
  const open = useSignal(false)
  return (
    <div class="settings-card">
      <div class="srow" onClick={() => { open.value = !open.value }}>
        <span class="srow-left">🗂️ {t('dataTools')}</span>
        <span style={{ color: 'var(--muted)', fontSize: '14px', transform: open.value ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform .15s' }}>›</span>
      </div>
      {open.value && (<>
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
  )
}

function DangerZoneCard() {
  const open = useSignal(false)
  return (
    <div class={`settings-card danger-zone-card`}>
      <div class="srow" onClick={() => { open.value = !open.value }}>
        <span class="srow-left" style={{ color: 'var(--r)' }}>⚠️ {t('dangerZone')}</span>
        <span style={{ color: 'var(--r)', fontSize: '14px', transform: open.value ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform .15s' }}>›</span>
      </div>
      {open.value && (
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
  )
}

export function Settings() {
  return (
    <div>
      <div class="sticky-hd"><div class="page-title">{t('settings')}</div></div>

      <CategoriesCard />
      <PreferencesCard />
      {'showDirectoryPicker' in window && <AutoBackupCard />}
      <AppLockCard />
      <DataToolsCard />
      <DangerZoneCard />

      <div style={{ textAlign: 'center', padding: '32px 0 8px', color: 'var(--muted)', fontSize: '12px' }}>
        {t('footer')} v{__APP_VERSION__}
      </div>
    </div>
  )
}
