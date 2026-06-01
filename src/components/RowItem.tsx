import type { ComponentChildren } from 'preact'

interface Props {
  emoji: string
  iconBg?: string
  title: string
  subtitle?: string
  date?: string
  amount?: number
  badge?: string
  rightSlot?: ComponentChildren
  onClick?: () => void
}

export function RowItem({ emoji, iconBg, title, subtitle, date, amount, badge, rightSlot, onClick }: Props) {
  return (
    <div class={`row-item${onClick ? ' clickable' : ''}`} onClick={onClick}>
      <div class="row-icon" style={iconBg ? { background: iconBg } : undefined}>
        {emoji}
      </div>
      <div class="row-info">
        <div class="row-title">
          {title}
          {badge && <span class="badge">{badge}</span>}
        </div>
        {subtitle && <div class="row-sub">{subtitle}</div>}
        {date && <div class="row-date">{date}</div>}
      </div>
      {rightSlot ?? (amount !== undefined && (
        <span class="amount">−{amount.toFixed(2)}</span>
      ))}
    </div>
  )
}
