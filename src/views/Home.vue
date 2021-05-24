<template>
  <div id="nav">
    <el-form v-if="!loginState" :model="loginForm" ref="form" :inline="true">
      <el-form-item label="Email address" size="medium">
        <el-input v-model="loginForm.username"></el-input>
      </el-form-item>
      <el-form-item label="Password">
        <el-input type="password" v-model="loginForm.password"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="login()">Login</el-button>
      </el-form-item>
    </el-form>
    <template v-else>
      <el-button type="default" @click="refreshDevices()">Refresh</el-button>
      <el-button type="default" @click="logout()">Logout</el-button>
    </template>
  </div>
  <div id="devices">
    <div v-for="device in devices" :key="device.id">
      <el-card class="device" :style="device.data.online === false ? 'filter: opacity(0.65) grayscale(1);' : ''">
        <el-tooltip effect="light" :content="device.type" offset="-20"
          :visible-arrow="false">
          <el-avatar :src="device.icon" shape="square">
            <img src="/device_icons/default.png"/>
          </el-avatar>
        </el-tooltip>
        <span class="device-name">{{ device.name }}</span>
        <template v-if="device.type === 'scene'">
          <el-button type="default" circle class="icon-big trigger"
            @click="triggerScene(device);"
          ><i class="el-icon-material">play_arrow</i></el-button>
        </template>
        <template v-else>
          <el-button type="default" circle class="icon-big"
            :class="device.data.state ? 'state-on' : 'state-off'"
            :disabled="!device.data.online"
            @click="toggleDevice(device);"
          ><i class="el-icon-material">{{ device.data.online ? 'power_settings_new' : 'cloud_off' }}</i></el-button>
        </template>
      </el-card>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const defaults = {
  region: 'eu'
}

let session = JSON.parse(localStorage.getItem('session'))
let client = session ? createClient() : null

function createClient () {
  return axios.create({
    baseURL: '/api/homeassistant',
    params: { region: session.region }
  })
}

function dropSession () {
  session = null
  client = null
}

async function newSession (userName, password, region) {
  region = region || defaults.region

  session = {
    region,
    userName
  }
  client = createClient()

  const authResponse = await client.post('/auth.do', new URLSearchParams({
    userName,
    password,
    countryCode: '00',
    bizType: 'smart_life',
    from: 'tuya'
  }))
  console.debug('auth.do', userName, authResponse.data)
  session.token = authResponse.data
  localStorage.setItem('session', JSON.stringify(session))
}

// TODO
// async function refreshSessionToken() {
//   const accessResponse = await client.post('/access.do', {
//     grant_type: 'refresh_token',
//     refresh_token: session.token.refresh_token,
//     rand: Math.random()
//   })
//   console.debug('access.do', accessResponse.data)
//   session.token = authResponse.data
//   localStorage.setItem('session', JSON.stringify(session))
// }

async function deviceDiscovery () {
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
  console.debug('device discovery', discoveryResponse.data)
  return discoveryResponse.data
}

// actions = ['turnOnOff', 'brightnessSet', 'colorSet', 'colorTemperatureSet']
async function deviceControl (deviceId, action, fieldValue, fieldName) {
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
  console.debug('device control', `${action}: ${fieldName}=${fieldValue}`, controlResponse.data)
  return controlResponse.data
}

export default {
  name: 'Home',
  components: {},
  data () {
    return {
      loginState: false,
      loginForm: {
        username: '',
        password: ''
      },
      devices: []
    }
  },
  methods: {
    async login () {
      await newSession(
        this.loginForm.username,
        this.loginForm.password
      )
      this.loginState = true
      await this.refreshDevices()
    },
    async logout () {
      dropSession()
      this.loginState = false
      this.devices = []
    },
    async refreshDevices () {
      // TODO handle expired session
      // get device list
      const discoveryResponse = await deviceDiscovery()
      const discoveryCode = discoveryResponse.header.code
      if (discoveryCode === 'SUCCESS') {
        this.devices = discoveryResponse.payload.devices.map(device => ({
          id: device.id,
          name: JSON.parse(`"${device.name}"`),
          type: device.dev_type,
          data: device.data,
          icon: `/device_icons/${device.dev_type}.png` // device.icon
        }))
        localStorage.setItem('devices', JSON.stringify(this.devices))
      } else {
        this.$message.error(`Oops, device discovery error. (${discoveryCode})`)
      }
    },
    async toggleDevice (device) {
      // TODO handle expired session
      // TODO change icon to el-icon-loading
      const newState = !device.data.state
      const controlResponse = await deviceControl(device.id, 'turnOnOff', newState)
      const controlCode = controlResponse.header.code
      if (controlCode === 'SUCCESS') {
        device.data.state = newState
      } else {
        this.$message.error(`Oops, device control error. (${controlCode})`)
      }
    },
    async triggerScene (device) {
      // TODO handle expired session
      // TODO change icon to el-icon-loading
      const controlResponse = await deviceControl(device.id, 'turnOnOff', true)
      const controlCode = controlResponse.header.code
      if (controlCode === 'SUCCESS') {
        // do nothing
        // todo user feedback
      } else {
        this.$message.error(`Oops, device control error. (${controlCode})`)
      }
    }
  },
  async mounted () {
    // TODO handle expired session
    this.devices = JSON.parse(localStorage.getItem('devices')) || []
    this.loginState = !!session
  }
}
</script>
<style scoped>
#nav {
  margin: 0 auto;
  margin-top: 64px;
  margin-bottom: 64px;
}

.el-card.device {
  max-width: 800px;
  margin: 0 auto;
  margin-bottom: 16px;
}

.el-card.device >>> .el-card__body {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}
.el-card.device >>> .el-card__body :last-child {
  margin-left: auto;
}

.el-button.icon-big {
  padding: 9px;
  font-size: 20px;
  line-height: 0px;
}

.el-button.state-on:enabled {
  color: #f9f9f9;
  background-color: #7dd8ba;
}
.el-button.state-off:enabled {
  color: #a3a4a7;
  background-color: #f9f9f9;
}
.el-button.trigger:enabled {
  color: #f9f9f9;
  background-color: #9eabce;
}

.el-avatar {
  background: transparent;
  margin-right: 16px;
}
</style>
