export type Locale = 'zh-CN' | 'en';

export const defaultLocale: Locale = 'en';

export const supportedLocales: Locale[] = ['en', 'zh-CN'];

export function getLocaleDisplayName(locale: Locale): string {
  const displayNames: Record<Locale, string> = {
    'en': 'English',
    'zh-CN': '中文',
  };
  return displayNames[locale] || locale;
}

export const translations = {
  'zh-CN': {
    // Header
    'header.subtitle': 'Claude Provider Switcher',
    'header.title': '快速切换 Claude Provider',
    'header.description': '管理并应用 Claude Code Provider 配置。所有更改都会写入 {path}，并保留最近 3 份备份。',
    'header.current': '当前',
    'header.notSet': '尚未设置当前 Provider',
    'header.noUrl': '未设置 Base URL',

    // Provider List
    'list.title': 'Provider 列表',
    'list.search': '搜索 Provider...',
    'list.empty': '暂无 Provider',
    'list.noMatch': '未找到匹配的 Provider',
    'list.apply': '应用',
    'list.applied': '已应用',
    'list.current': '当前',
    'list.preset': '预设',
    'list.edit': '编辑',
    'list.delete': '删除',
    'list.deleteConfirm': '确认删除',
    'list.deleteWarning': '确定要删除 {name} 吗？此操作不会影响 Claude 的历史配置，但会从列表中移除该 Provider。',
    'list.cancel': '取消',
    'list.missingConfig': '缺少配置',
    'list.missingFields': '— 请点击编辑补充',
    'list.anthropicNote': '使用你的 Claude 订阅，通过官方 API 访问',
    'list.model': '模型',
    'list.website': '官网',
    'list.copyUrl': '复制 URL',
    'list.add': '添加',

    // Provider Form
    'form.addTitle': '新增 Provider',
    'form.editTitle': '编辑 Provider',
    'form.editingHint': '正在编辑: {name}',
    'form.name': '名称',
    'form.nameRequired': 'Provider 名称不能为空',
    'form.id': 'ID',
    'form.idHint': '选填，小写字母/数字/-，最长 24 位',
    'form.idEditHint': '创建后不可修改',
    'form.idInvalid': '只能使用小写字母、数字和连字符',
    'form.idTooLong': 'ID 最多 24 个字符',
    'form.baseUrl': 'Base URL',
    'form.baseUrlRequired': 'Base URL 不能为空',
    'form.baseUrlInvalid': '请输入有效的 URL',
    'form.authToken': 'Auth Token',
    'form.authTokenRequired': 'Auth Token 不能为空',
    'form.authTokenHint': '留空保持不变',
    'form.model': 'Model',
    'form.website': '官网',
    'form.websiteInvalid': '请输入有效的 URL',
    'form.description': '描述',
    'form.save': '保存',
    'form.add': '新增',
    'form.reset': '重置',
    'form.clear': '清空',
    'form.cancel': '取消',

    // Backup
    'backup.title': 'Claude 设置备份',
    'backup.empty': '暂无备份',
    'backup.restore': '恢复',
    'backup.restoreConfirm': '恢复 Claude 设置',
    'backup.restoreWarning': '确定要恢复备份 {time} 吗？当前设置会先自动备份一次。',
    'backup.cancel': '取消',

    // Toast Messages
    'toast.copied': '已复制',
    'toast.copyFailed': '复制失败',
    'toast.providerApplied': '已切换到 "{name}"',
    'toast.providerDeleted': '"{name}" 已删除',
    'toast.providerUpdated': 'Provider 已更新',
    'toast.providerAdded': 'Provider 已创建',
    'toast.backupRestored': '备份已恢复',
    'toast.error.providerIdMissing': 'Provider ID 缺失',
    'toast.error.loadFailed': '加载 Providers 失败',
    'toast.error.applyFailed': '应用 Provider 失败',
    'toast.error.saveFailed': '保存 Provider 失败',
    'toast.error.deleteFailed': '删除 Provider 失败',
    'toast.error.restoreFailed': '恢复备份失败',

    // Footer
    'footer.madeWith': 'Made with',
    'footer.forUsers': 'for Claude Code users',
  },
  'en': {
    // Header
    'header.subtitle': 'Claude Provider Switcher',
    'header.title': 'Quickly Switch Claude Providers',
    'header.description': 'Manage and apply Claude Code Provider configurations. All changes are written to {path}, with the last 3 backups retained.',
    'header.current': 'Current',
    'header.notSet': 'No provider set yet',
    'header.noUrl': 'No Base URL set',

    // Provider List
    'list.title': 'Provider List',
    'list.search': 'Search providers...',
    'list.empty': 'No providers',
    'list.noMatch': 'No matching providers found',
    'list.apply': 'Apply',
    'list.applied': 'Applied',
    'list.current': 'Current',
    'list.preset': 'Preset',
    'list.edit': 'Edit',
    'list.delete': 'Delete',
    'list.deleteConfirm': 'Confirm Delete',
    'list.deleteWarning': 'Are you sure you want to delete {name}? This will not affect Claude\'s historical configuration, but will remove this provider from the list.',
    'list.cancel': 'Cancel',
    'list.missingConfig': 'Missing Configuration',
    'list.missingFields': '— Click edit to add',
    'list.anthropicNote': 'Use your Claude subscription via official API',
    'list.model': 'Model',
    'list.website': 'Website',
    'list.copyUrl': 'Copy URL',
    'list.add': 'Add',

    // Provider Form
    'form.addTitle': 'Add Provider',
    'form.editTitle': 'Edit Provider',
    'form.editingHint': 'Editing: {name}',
    'form.name': 'Name',
    'form.nameRequired': 'Provider name is required',
    'form.id': 'ID',
    'form.idHint': 'Optional, lowercase letters/numbers/-, max 24 chars',
    'form.idEditHint': 'Cannot be changed after creation',
    'form.idInvalid': 'Only lowercase letters, numbers and hyphens allowed',
    'form.idTooLong': 'ID max 24 characters',
    'form.baseUrl': 'Base URL',
    'form.baseUrlRequired': 'Base URL is required',
    'form.baseUrlInvalid': 'Please enter a valid URL',
    'form.authToken': 'Auth Token',
    'form.authTokenRequired': 'Auth Token is required',
    'form.authTokenHint': 'Leave empty to keep unchanged',
    'form.model': 'Model',
    'form.website': 'Website',
    'form.websiteInvalid': 'Please enter a valid URL',
    'form.description': 'Description',
    'form.save': 'Save',
    'form.add': 'Add',
    'form.reset': 'Reset',
    'form.clear': 'Clear',
    'form.cancel': 'Cancel',

    // Backup
    'backup.title': 'Claude Settings Backup',
    'backup.empty': 'No backups',
    'backup.restore': 'Restore',
    'backup.restoreConfirm': 'Restore Claude Settings',
    'backup.restoreWarning': 'Are you sure you want to restore backup {time}? Current settings will be automatically backed up first.',
    'backup.cancel': 'Cancel',

    // Toast Messages
    'toast.copied': 'Copied',
    'toast.copyFailed': 'Copy failed',
    'toast.providerApplied': 'Switched to "{name}"',
    'toast.providerDeleted': '"{name}" deleted',
    'toast.providerUpdated': 'Provider updated',
    'toast.providerAdded': 'Provider created',
    'toast.backupRestored': 'Backup restored',
    'toast.error.providerIdMissing': 'Provider ID is missing',
    'toast.error.loadFailed': 'Failed to load providers',
    'toast.error.applyFailed': 'Failed to apply provider',
    'toast.error.saveFailed': 'Failed to save provider',
    'toast.error.deleteFailed': 'Failed to delete provider',
    'toast.error.restoreFailed': 'Failed to restore backup',

    // Footer
    'footer.madeWith': 'Made with',
    'footer.forUsers': 'for Claude Code users',
  },
} as const;

export type TranslationKey = keyof typeof translations['en'];

export function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  // First, try to get the value directly (flat key like 'header.subtitle')
  if (path in obj) {
    const directValue = obj[path];
    return typeof directValue === 'string' ? directValue : undefined;
  }

  // If not found, try nested path (like 'header.subtitle' -> obj['header']['subtitle'])
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}
