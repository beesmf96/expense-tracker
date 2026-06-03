import { render } from 'preact'
import { App } from './App'
import { loadAll, initAutoBackup } from './db/queries'
import { initLockWatcher } from './lib/lockHelpers'
import './styles/global.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/forms.css'

loadAll().then(async () => {
  await initAutoBackup()
  initLockWatcher()
  render(<App />, document.body)
})
