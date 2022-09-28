import axios from 'axios'

const defaults = {
  region: 'eu'
}

function ensureSuccess (response) {
  const data = response.data
  if (typeof data !== 'object') {
    throw new Error(data)
  }
  if (data.access_token) {
    return
  }
  if (data.responseStatus === 'error') {
    throw new Error(data.errorMsg)
  }
  if (!data.header || data.header.code !== 'SUCCESS') {
    throw new Error(data.header.msg)
  }
}

function HomeAssistantClient (session) {
  let client
  if (session) {
    client = createClient(session.region)
  }

  function createClient (region) {
    return axios.create({ baseURL: '/api/homeassistant', params: { region } })
  }

  function normalizeToken (token) {
    const result = {
      ...token,
      expires: Math.trunc((Date.now() / 1000)) + token.expires_in
    }
    delete result.expires_in
    return result
  }

  this.login = async (userName, password, region) => {
    region = region || defaults.region

    client = createClient(region)

    const authResponse = await client.post('/auth.do', new URLSearchParams({
      userName,
      password,
      countryCode: '00',
      bizType: 'smart_life',
      from: 'tuya'
    }))
    console.debug('auth.do', userName, authResponse.data)
    ensureSuccess(authResponse)

    session = {
      region,
      token: normalizeToken(authResponse.data)
    }
  }

  this.refreshAuthToken = async () => {
    const accessResponse = await client.post('/access.do', {
      grant_type: 'refresh_token',
      refresh_token: session.token.refresh_token,
      rand: Math.random()
    })
    console.debug('access.do', accessResponse.data)
    ensureSuccess(accessResponse)

    session.token = normalizeToken(accessResponse.data)
  }

  this.getSession = () => session

  this.dropSession = () => { session = null }

  this.deviceDiscovery = async () => {
    const discoveryResponse = await client.post('/skill', {
      header: {
        payloadVersion: 1,
        namespace: 'discovery',
        name: 'Discovery'
      },
      payload: {
        accessToken: session.token.access_token
      }
    })
    console.debug('device discovery response', discoveryResponse.data)
    ensureSuccess(discoveryResponse)

    const payload = discoveryResponse.data.payload
    if (payload && payload.devices) {
      // fix payload data
      payload.devices = payload.devices
        .map(device => {
          // workaround json escaped signes
          device.name = JSON.parse(`"${device.name}"`)
        
          // workaround automation type
          if (device.dev_type === 'scene' && device.name.endsWith('#')) {
            device.dev_type = 'automation'
            device.name = device.name.replace(/\s*#$/, '')
          }

          return {
            id: device.id,
            name: device.name,
            type: device.dev_type,
            data: device.data,
            icon: device.icon
          }
        })
        .filter(device => device.type !== 'automation')
    }

    return discoveryResponse.data
  }

  // actions = ['turnOnOff', 'brightnessSet', 'colorSet', 'colorTemperatureSet']
  this.deviceControl = async (deviceId, action, fieldValue, fieldName) => {
    // for testing purpose only
    if (deviceId === 0) {
      return { header: { code: 'SUCCESS' } }
    }

    fieldName = fieldName || 'value'

    if (action === 'turnOnOff' &&
      fieldName === 'value' &&
      typeof fieldValue === 'boolean') {
      fieldValue = fieldValue ? 1 : 0
    }

    const controlResponse = await client.post('/skill', {
      header: {
        payloadVersion: 1,
        namespace: 'control',
        name: action
      },
      payload: {
        accessToken: session.token.access_token,
        devId: deviceId,
        [fieldName]: fieldValue
      }
    })
    console.debug('device control response', `${action}: ${fieldName}=${fieldValue}`, controlResponse.data)
    ensureSuccess(controlResponse)
  }
}

export default {
  HomeAssistantClient
}
