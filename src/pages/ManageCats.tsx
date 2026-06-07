import { activePage, allCatsList, txs, openM } from '../state/store'
import { t, catLabel } from '../data/i18n'
import { delCat } from '../db/queries'

export function ManageCats() {
  const cats = allCatsList.value
  const allTxs = txs.value

  function txCount(catId: string): number {
    return allTxs.filter(tx => tx.category === catId).length
  }

  function askDelete(catId: string) {
    const count = txCount(catId)
    if (count > 0) {
      openM('reclassify', { rclFrom: catId, rclDelete: true })
    } else {
      openM('confirm', {
        confirmIcon: '🗑️',
        confirmTitle: t('delete'),
        confirmMsg: `Delete category "${catLabel(cats.find(c => c.id === catId) ?? { en: catId, zh: catId, id: catId, emoji: '' })}"?`,
        confirmOkLabel: t('delete'),
        confirmOnOk: () => delCat(catId),
      })
    }
  }

  return (
    <div>
      <div class="sticky-hd" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button class="icon-btn" onClick={() => { activePage.value = 'settings' }} style={{ fontSize: '20px', padding: '0' }}>
          ‹
        </button>
        <div class="page-title" style={{ marginBottom: 0, flex: 1 }}>{t('manageCats')}</div>
      </div>

      {cats.map(cat => {
        const count = txCount(cat.id)
        return (
          <div key={cat.id} class="row-item">
            <div class="row-icon">{cat.emoji}</div>
            <div class="row-info">
              <div class="row-title">{catLabel(cat)}</div>
              <div class="row-sub">{count} {t('records2')}</div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button class="icon-btn" onClick={() => openM('editcat', { editCatId: cat.id })} title="Edit">✏️</button>
              {count > 0 && (
                <button class="icon-btn" onClick={() => openM('reclassify', { rclFrom: cat.id, rclDelete: false })} title="Reclassify">⇄</button>
              )}
              <button class="icon-btn" style={{ color: 'var(--r)' }} onClick={() => askDelete(cat.id)} title="Delete">✕</button>
            </div>
          </div>
        )
      })}
      <div class="row-item row-add clickable" onClick={() => openM('newcat')}>
        <div class="row-icon row-add-icon">➕</div>
        <div class="row-info">
          <div class="row-title">{t('addCat')}</div>
        </div>
      </div>
    </div>
  )
}
