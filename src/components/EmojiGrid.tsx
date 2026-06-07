interface Props {
  emojis: readonly string[]
  selectedEmoji: string
  onSelect: (emoji: string) => void
}

export function EmojiGrid({ emojis, selectedEmoji, onSelect }: Props) {
  return (
    <div class="emoji-grid">
      {emojis.map(e => (
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
