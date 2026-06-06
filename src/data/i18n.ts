import type { Lang } from '../types'
import { lang } from '../state/store'
import { FREQS } from './cats'

const S = {
  en: {
    home: 'Home', records: 'Records', recurring: 'Recurring', settings: 'Settings',
    amount: 'Amount', category: 'Category', date: 'Date', note: 'Note',
    startDate: 'Start Date', frequency: 'Frequency',
    monthly: 'Monthly', quarterly: 'Quarterly', biannual: 'Biannual', yearly: 'Yearly',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', add: 'Add', close: 'Close',
    manageCats: 'Manage Categories', addCat: 'New Category',
    catName: 'Category Name', chooseIcon: 'Choose Icon',
    backup: 'Backup Data', restore: 'Restore Backup', clearAll: 'Clear All Data',
    language: 'Language', appearance: 'Appearance', darkTheme: 'Dark theme', lightTheme: 'Light theme',
    thisMonth: 'This Month', byCat: 'By Category',
    noExpense: 'No expenses this month.\nTap + to add one.',
    noRecords: 'No transactions yet.\nTap + to add one.',
    noRecurring: 'No recurring expenses.\nTap + to add one.',
    txDetail: 'Transaction', autoGen: 'Auto-generated',
    since: 'Since', reclassify: 'Reclassify',
    moveTo: 'Move to', moveConfirm: 'Move', selectTarget: 'Select target category',
    records2: 'records', moveBeforeDel: 'Move Records First',
    confirmDel: 'Delete Transaction', confirmClear: 'Clear All Data',
    confirmMove: 'Move Records',
    addExpense: 'Add Expense', addRecurring: 'Add Recurring',
    editExpense: 'Edit Expense', editRecurring: 'Edit Recurring', edit: 'Edit',
    editCat: 'Edit Category', newCat: 'New Category',
    footer: 'MyLedger', dangerZone: 'Danger Zone', dataTools: 'Data Tools',
    search: 'Search', searchPlaceholder: 'Search notes or categories…', searchEmpty: 'No results', searchHint: 'Search your expenses',
    catBreakdown: 'Category Breakdown',
    autoBackup: 'Auto Backup', folderNotSet: 'Not configured', pickFolder: 'Pick folder',
    grantAccess: 'Grant access', clearFolder: 'Clear',
    cleared: 'All data cleared', restored: 'Backup restored',
    errAmount: 'Please enter an amount', errCat: 'Please select a category',
    quickSaved: 'Saved', more: 'More', quickNoCats: 'Add a category first',
    appLock: 'App Lock', setPIN: 'Set PIN', changePIN: 'Change PIN', disablePIN: 'Disable PIN',
    enterNewPIN: 'Enter new PIN', confirmPIN: 'Confirm PIN', enterCurrentPIN: 'Enter current PIN',
    pinMismatch: 'PINs do not match', pinWrong: 'Incorrect PIN',
    pinSet: 'PIN enabled', pinDisabled: 'PIN disabled',
    pinTryAgainIn: 'Try again in', pinSeconds: 's',
    lockOn: 'ON', lockOff: 'OFF', pinBackspace: 'Backspace',
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    mfmt: (y: number, m: number) => `${S.en.months[m]} ${y}`,
  },
  zh: {
    home: '主页', records: '记录', recurring: '周期', settings: '设置',
    amount: '金额', category: '类别', date: '日期', note: '备注',
    startDate: '开始日期', frequency: '频率',
    monthly: '每月', quarterly: '每季度', biannual: '每半年', yearly: '每年',
    save: '保存', cancel: '取消', delete: '删除', add: '添加', close: '关闭',
    manageCats: '管理类别', addCat: '新类别',
    catName: '类别名称', chooseIcon: '选择图标',
    backup: '备份数据', restore: '恢复备份', clearAll: '清除所有数据',
    language: '语言', appearance: '外观', darkTheme: '深色', lightTheme: '浅色',
    thisMonth: '本月', byCat: '按类别',
    noExpense: '本月暂无支出。\n点击 + 添加。',
    noRecords: '暂无记录。\n点击 + 添加。',
    noRecurring: '暂无周期支出。\n点击 + 添加。',
    txDetail: '交易详情', autoGen: '自动生成',
    since: '自', reclassify: '重新分类',
    moveTo: '移至', moveConfirm: '移动', selectTarget: '选择目标类别',
    records2: '条记录', moveBeforeDel: '请先移动记录',
    confirmDel: '删除交易', confirmClear: '清除所有数据',
    confirmMove: '移动记录',
    addExpense: '添加支出', addRecurring: '添加周期支出',
    editExpense: '编辑支出', editRecurring: '编辑周期支出', edit: '编辑',
    editCat: '编辑类别', newCat: '新类别',
    footer: 'MyLedger', dangerZone: '危险区域', dataTools: '数据工具',
    search: '搜索', searchPlaceholder: '搜索备注或类别…', searchEmpty: '无结果', searchHint: '搜索你的支出',
    catBreakdown: '类别明细',
    autoBackup: '自动备份', folderNotSet: '未配置', pickFolder: '选择文件夹',
    grantAccess: '授权访问', clearFolder: '清除',
    cleared: '数据已清除', restored: '备份已恢复',
    errAmount: '请输入金额', errCat: '请选择类别',
    quickSaved: '已保存', more: '更多', quickNoCats: '请先添加类别',
    appLock: '应用锁', setPIN: '设置密码', changePIN: '修改密码', disablePIN: '关闭密码',
    enterNewPIN: '输入新密码', confirmPIN: '确认密码', enterCurrentPIN: '输入当前密码',
    pinMismatch: '密码不一致', pinWrong: '密码错误',
    pinSet: '密码已启用', pinDisabled: '密码已关闭',
    pinTryAgainIn: '请等待', pinSeconds: '秒',
    lockOn: '已开启', lockOff: '未开启', pinBackspace: '退格',
    months: ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
    mfmt: (y: number, m: number) => `${y}年 ${S.zh.months[m]}`,
  },
}

export type StringKey = keyof typeof S.en

export function t(key: StringKey): string {
  return (S[lang.value] as Record<string, unknown>)[key] as string
}

export function mfmt(y: number, m: number): string {
  return S[lang.value].mfmt(y, m)
}

export function catLabel(cat: { en: string; zh: string; label?: string }, l?: Lang): string {
  const lng = l ?? lang.value
  return cat[lng] || cat.label || cat.en || cat.zh
}

export function freqLabel(freq: string): string {
  const f = FREQS.find(x => x.value === freq)
  return f ? (lang.value === 'zh' ? f.zh : f.en) : freq
}
