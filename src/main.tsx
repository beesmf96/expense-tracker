import { render } from 'preact'
import { App } from './App'
import { loadAll, initAutoBackup } from './db/queries'
import './styles/global.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/forms.css'

loadAll().then(async () => {
  await initAutoBackup()
  render(<App />, document.body)
})
