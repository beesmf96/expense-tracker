import { EMOJIS } from '../data/cats'

interface Props {
  selectedEmoji: string
  onSelect: (emoji: string) => void
}

export function EmojiGrid({ selectedEmoji, onSelect }: Props) {
  return (
    <div class="emoji-grid">
      {EMOJIS.map(e => (
        <div
          key={e}
          class={`emoji-opt${selectedEmoji === e ? ' selected' : ''}`}
          onClick={() => onSelect(e)}
        >
          {e}
        </div>
      ))}
    </div>
  )
}
