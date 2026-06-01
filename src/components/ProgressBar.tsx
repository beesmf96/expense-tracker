interface Props {
  pct: number
  color: string
}

export function ProgressBar({ pct, color }: Props) {
  return (
    <div class="bar-wrap">
      <div class="bar" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  )
}
