/* src/registerServiceWorker.js */
import { register } from 'register-service-worker'

if (process.env.NODE_ENV === 'production') {
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })

  const notifyUpdate = (registration) => {
    window.dispatchEvent(new CustomEvent('swUpdated', { detail: registration }))
  }

  register(`${process.env.BASE_URL}service-worker.js`, {
    ready() {
      // optional: console.info('App is being served from cache by a service worker.')
    },
    registered() {
      // optional: console.info('Service worker has been registered.')
    },
    cached() {
      // optional: console.info('Content has been cached for offline use.')
    },
    updatefound() {
      // optional: console.info('New content is downloading.')
    },
    updated(registration) {
      notifyUpdate(registration)
    },
    offline() {
      // optional: console.info('No internet connection found. App is running in offline mode.')
    },
    error(error) {
      console.error('Error during service worker registration:', error)
    }
  })
}
