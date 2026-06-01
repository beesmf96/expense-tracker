import type { ComponentChildren } from 'preact'
import type { ModalId } from '../types'
import { openModal, closeM } from '../state/store'

interface Props {
  id: ModalId
  children: ComponentChildren
}

export function Modal({ id, children }: Props) {
  const isOpen = openModal.value === id

  return (
    <div id={`m-${id}`} class={`overlay${isOpen ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) closeM() }}>
      <div class="modal" onClick={e => e.stopPropagation()}>
        <div class="modal-handle" />
        {children}
      </div>
    </div>
  )
}
