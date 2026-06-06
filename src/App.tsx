import { activePage } from './state/store'
import { BottomNav } from './components/BottomNav'
import { FAB } from './components/FAB'
import { Home } from './pages/Home'
import { Transactions } from './pages/Transactions'
import { Recurring } from './pages/Recurring'
import { Settings } from './pages/Settings'
import { ManageCats } from './pages/ManageCats'
import { Search } from './pages/Search'
import { ExpenseModal } from './modals/ExpenseModal'
import { RecurringModal } from './modals/RecurringModal'
import { DetailModal } from './modals/DetailModal'
import { ConfirmModal } from './modals/ConfirmModal'
import { NewCatModal } from './modals/NewCatModal'
import { EditCatModal } from './modals/EditCatModal'
import { ReclassifyModal } from './modals/ReclassifyModal'
import { CatBreakdownModal } from './modals/CatBreakdownModal'
import { PinSetupModal } from './modals/PinSetupModal'
import { QuickAddBar } from './components/QuickAddBar'
import { LockScreen } from './components/LockScreen'
import { Toast } from './components/Toast'

export function App() {
  const page = activePage.value

  return (
    <>
      <div id="page-home" class={`page page-qab${page === 'home' ? ' active' : ''}`}>
        <Home />
      </div>
      <div id="page-transactions" class={`page page-qab${page === 'transactions' ? ' active' : ''}`}>
        <Transactions />
      </div>
      <div id="page-recurring" class={`page${page === 'recurring' ? ' active' : ''}`}>
        <Recurring />
      </div>
      <div id="page-settings" class={`page${page === 'settings' ? ' active' : ''}`}>
        <Settings />
      </div>
      <div id="page-manage-cats" class={`page${page === 'manage-cats' ? ' active' : ''}`}>
        <ManageCats />
      </div>
      <div id="page-search" class={`page${page === 'search' ? ' active' : ''}`}>
        <Search />
      </div>

      <QuickAddBar />
      <BottomNav />
      <FAB />

      <ExpenseModal />
      <RecurringModal />
      <DetailModal />
      <ConfirmModal />
      <NewCatModal />
      <EditCatModal />
      <ReclassifyModal />
      <CatBreakdownModal />
      <PinSetupModal />
      <LockScreen />
      <Toast />
    </>
  )
}
