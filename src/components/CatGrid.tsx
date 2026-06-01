import { allCatsList, openM } from '../state/store'
import { catLabel, t } from '../data/i18n'

interface Props {
  selectedId: string
  onSelect: (id: string) => void
}

export function CatGrid({ selectedId, onSelect }: Props) {
  const cats = allCatsList.value

  return (
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
  )
}
