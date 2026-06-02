import { allCatsList, openM } from '../state/store'
import { catLabel, t } from '../data/i18n'

interface Props {
  selectedId: string
  onSelect: (id: string) => void
}

export function CatGrid({ selectedId, onSelect }: Props) {
  const cats = allCatsList.value
  const selCat = cats.find(c => c.id === selectedId)

  return (
    <div>
      <div class="cat-sel-label">
        {selCat && <><span>{selCat.emoji}</span><span>{catLabel(selCat)}</span></>}
      </div>
      <div class="cat-grid-wrap">
        <div class="cat-grid">
          {cats.map(cat => (
            <div
              key={cat.id}
              class={`cat-pill${selectedId === cat.id ? ' selected' : ''}`}
              onClick={() => onSelect(cat.id)}
            >
              <span class="cemoji">{cat.emoji}</span>
              <span class="clabel">{catLabel(cat)}</span>
            </div>
          ))}
          <div
            class="cat-pill dashed"
            onClick={() => openM('newcat', { newCatReturnSel: onSelect })}
          >
            <span class="cemoji">➕</span>
            <span class="clabel">{t('addCat')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
