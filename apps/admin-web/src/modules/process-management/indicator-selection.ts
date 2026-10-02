import { ref, watch } from 'vue'

// Display preference only. Never use this list to construct a calculation catalog.
export const indicatorPreferenceKey = (site: string) => `waterx-indicator-display:v1:${encodeURIComponent(site)}`
export function useIndicatorSelection(site: () => string) {
  const hidden = ref<string[]>([]), selectionError = ref('')
  watch(site, value => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(indicatorPreferenceKey(value)) || '[]')
      if (!Array.isArray(parsed) || parsed.some(id => typeof id !== 'string')) throw new Error('指标显示设置格式不正确')
      hidden.value = parsed; selectionError.value = ''
    } catch { hidden.value = []; selectionError.value = '指标显示设置读取失败，暂时展示全部指标；原设置未覆盖。' }
  }, { immediate: true })
  function saveSelection(ids: string[]) {
    try {
      localStorage.setItem(indicatorPreferenceKey(site()), JSON.stringify([...new Set(ids)]))
      hidden.value = [...ids]; selectionError.value = ''; return true
    } catch { selectionError.value = '指标显示设置保存失败，请检查浏览器存储权限。'; return false }
  }
  return { hidden, selectionError, saveSelection }
}
