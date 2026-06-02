import type { ComponentChildren } from 'preact'

interface Props {
  icon: string
  message: string
  children?: ComponentChildren
}

export function EmptyState({ icon, message, children }: Props) {
  return (
    <div class="empty">
      <span class="ei">{icon}</span>
      <p>{message}</p>
      {children}
    </div>
  )
}
