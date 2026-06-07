import { useSignal } from '@preact/signals'
import { EMOJI_GROUPS } from '../data/cats'
import type { EmojiGroupKey } from '../data/cats'
import { t } from '../data/i18n'
import { EmojiGrid } from './EmojiGrid'

interface Props {
  selectedEmoji: string
  onSelect: (emoji: string) => void
}

export function EmojiPicker({ selectedEmoji, onSelect }: Props) {
  const activeTab = useSignal<EmojiGroupKey>('money')
  const activeGroup = EMOJI_GROUPS.find(g => g.key === activeTab.value) ?? EMOJI_GROUPS[0]

  return (
    <div>
      <div class="emoji-tabs-wrap">
        <div class="emoji-tabs">
          {EMOJI_GROUPS.map(g => (
            <button
              key={g.key}
              class={`${activeTab.value === g.key ? 'active' : ''}`}
              onClick={() => { activeTab.value = g.key }}
            >
              {t(`emojiGroup_${g.key}` as Parameters<typeof t>[0])}
            </button>
          ))}
        </div>
      </div>
      <EmojiGrid emojis={activeGroup.emojis} selectedEmoji={selectedEmoji} onSelect={onSelect} />
    </div>
  )
}
