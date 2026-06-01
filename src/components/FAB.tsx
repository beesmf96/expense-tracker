import { activePage, openM } from '../state/store'

export function FAB() {
  const page = activePage.value
  if (page === 'settings' || page === 'manage-cats') return null

  function handleClick() {
    if (page === 'recurring') {
      openM('recurring')
    } else {
      openM('expense')
    }
  }

  return (
    <button class="fab" onClick={handleClick} aria-label="Add">
      +
    </button>
  )
}
