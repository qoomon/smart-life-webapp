/* src/composables/useOnline.js */
import { ref, onMounted, onUnmounted } from 'vue'
export function useOnline() {
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const update = () => { isOnline.value = navigator.onLine }
  onMounted(() => {
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
  })
  onUnmounted(() => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  })
  return { isOnline }
}
