import { FREQS } from '../data/cats'
import { lang } from '../state/store'

type ActiveFreq = 'monthly' | 'quarterly' | 'biannual' | 'yearly'

interface Props {
  selectedFreq: ActiveFreq
  onSelect: (freq: ActiveFreq) => void
}

export function FreqGrid({ selectedFreq, onSelect }: Props) {
  return (
    <div class="freq-grid">
      {FREQS.map(f => (
        <div
          key={f.value}
          class={`freq-pill${selectedFreq === f.value ? ' selected' : ''}`}
          onClick={() => onSelect(f.value)}
        >
          {lang.value === 'zh' ? f.zh : f.en}
        </div>
      ))}
    </div>
  )
}
