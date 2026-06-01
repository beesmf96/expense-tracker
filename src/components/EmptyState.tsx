interface Props {
  icon: string
  message: string
}

export function EmptyState({ icon, message }: Props) {
  return (
    <div class="empty">
      <span class="ei">{icon}</span>
      <p>{message}</p>
    </div>
  )
}
