import type { ComponentChildren } from 'preact'

interface Props {
  label: string
  children: ComponentChildren
}

export function FormField({ label, children }: Props) {
  return (
    <div class="field">
      <label>{label}</label>
      {children}
    </div>
  )
}
