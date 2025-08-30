/* vue.config.js */
module.exports = {
  devServer: {
    proxy: {
      '/api/homeassistant': {
        target: 'https://px1.tuyaeu.com',
        changeOrigin: true,
        pathRewrite: {
          '^/api/homeassistant': '/homeassistant'
        },
        onProxyReq: (proxyReq, req, res) => {
          // Remove region parameter from the proxied request
          const url = new URL(proxyReq.path, `http://localhost`);
          url.searchParams.delete('region');
          proxyReq.path = url.pathname + url.search;
        },
        router: function(req) {
          const region = req.query.region || 'eu';
          return `https://px1.tuya${region}.com`;
        }
      }
    }
  },
  pwa: {
    name: 'Smart Life Webapp',
    themeColor: '#42b983',
    msTileColor: '#42b983',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black-translucent',
    manifestOptions: {
      name: 'Smart Life Webapp',
      short_name: 'Smart Life',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#42b983',
      icons: [
        { src: 'img/icons/manifest-icon-192.maskable.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: 'img/icons/manifest-icon-512.maskable.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
      ]
    },
    // Icon tags injected into index.html. We only set the ones we generated.
    iconPaths: {
      favicon32: 'img/icons/favicon-32x32.png',
      favicon16: 'img/icons/favicon-16x16.png',
      appleTouchIcon: 'img/icons/apple-icon-180.png',
      msTileImage: 'img/icons/mstile-icon-270.png'
    },
    workboxPluginMode: 'GenerateSW',
    workboxOptions: {
      cleanupOutdatedCaches: true,
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [ /^\/api\//, /^\/api\/homeassistant\// ],
      exclude: [ /\.map$/, /manifest\.json$/, /device_icons\// ],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-webfonts',
            expiration: { maxEntries: 30, maxAgeSeconds: 31536000 }
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'google-fonts-stylesheets' }
        },
        {
          urlPattern: /\/device_icons\/.*\.png$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'device-icons-v1',
            expiration: { maxEntries: 500, maxAgeSeconds: 31536000 },
            cacheableResponse: { statuses: [0, 200] }
          }
        },
        {
          urlPattern: /\.(?:js|css)$/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'static-resources',
            expiration: { maxEntries: 200, maxAgeSeconds: 2592000 },
            cacheableResponse: { statuses: [0, 200] }
          }
        },
        {
          urlPattern: /\/api\/homeassistant\//,
          handler: 'NetworkOnly',
          method: 'GET'
        },
        {
          urlPattern: /\/api\/homeassistant\//,
          handler: 'NetworkOnly',
          method: 'POST'
        }
      ]
    }
  }
}
