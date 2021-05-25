import axios from 'axios'

const defaults = {
  region: 'eu'
}

function HomeAssistantClient (session) {
  let client
  if (session) {
    client = createClient(session.region)
  }

  function createClient (region) {
    return axios.create({ baseURL: '/api/homeassistant', params: { region } })
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

    session = {
      region,
      token: authResponse.data
    }
  }

  this.refreshAuthToken = async () => {
    const accessResponse = await client.post('/access.do', {
      grant_type: 'refresh_token',
      refresh_token: session.token.refresh_token,
      rand: Math.random()
    })
    console.debug('access.do', accessResponse.data)
    session.token = accessResponse.data
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

    if (typeof discoveryResponse.data !== 'object') {
      discoveryResponse.data = {
        header: {
          code: discoveryResponse.data
        }
      }
    }
    console.debug('device discovery response', discoveryResponse.data)

    const payload = discoveryResponse.data.payload
    if (payload && payload.devices) {
      // fix payload data
      payload.devices = payload.devices
        .map(device => {
          // workaround automation type
          if (device.dev_type === 'scene') {
            if (device.name.endsWith('#')) {
              device.name = device.name.replace(/ *#$/, '')
            } else {
              device.dev_type = 'automation'
            }
          }

          // workaround json escaped signes
          device.name = JSON.parse(`"${device.name}"`)

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

    console.debug('device discovery result', discoveryResponse.data)
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
    return controlResponse.data
  }
}

export default {
  HomeAssistantClient
}
