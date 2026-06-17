interface Props {
  pct: number
  color: string
  over?: boolean
}

export function ProgressBar({ pct, color, over }: Props) {
  return (
    <div class="bar-wrap">
      <div class="bar" style={{ width: `${Math.min(100, pct)}%`, background: over ? 'var(--r)' : color }} />
    </div>
  )
}
