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
    <div v-for="device in devicesSorted" :key="device.id">
      <el-card class="device" :style="device.data.online === false ? 'filter: opacity(0.65) grayscale(1);' : ''">
        <el-tooltip effect="light" :content="device.type" :offset="-20"
          :visible-arrow="false">
          <el-avatar :src="`/device_icons/${device.type}.png`" shape="square">
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
import tuya from '@/libs/tuya'

const homeAssistantClient = new tuya.HomeAssistantClient(
  JSON.parse(localStorage.getItem('session'))
)

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
  computed: {
    devicesSorted () {
      return [...this.devices].sort((d1, d2) => {
        const v1 = d1.data.online === false ? 1 : 0
        const v2 = d2.data.online === false ? 1 : 0
        return v1 > v2 ? 1 : -1
      })
    }
  },
  methods: {
    async login () {
      await homeAssistantClient.login(
        this.loginForm.username,
        this.loginForm.password
      )
      localStorage.setItem('session', JSON.stringify(homeAssistantClient.getSession()))
      this.loginState = true
      await this.refreshDevices()
    },
    async logout () {
      homeAssistantClient.dropSession()
      localStorage.clear()
      this.loginState = false
      this.devices = []
    },
    async refreshDevices () {
      // TODO handle expired session
      // get device list
      const discoveryResponse = await homeAssistantClient.deviceDiscovery()
      const discoveryCode = discoveryResponse.header.code
      if (discoveryCode === 'SUCCESS') {
        this.devices = discoveryResponse.payload.devices
        localStorage.setItem('devices', JSON.stringify(this.devices))
      } else {
        this.$message.error(`Oops, device discovery error. (${discoveryCode})`)
      }
    },
    async toggleDevice (device) {
      // TODO handle expired session
      // TODO change icon to el-icon-loading
      const newState = !device.data.state
      const controlResponse = await homeAssistantClient.deviceControl(device.id, 'turnOnOff', newState)
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
      const controlResponse = await homeAssistantClient.deviceControl(device.id, 'turnOnOff', true)
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
    this.loginState = !!homeAssistantClient.getSession()
    if (!this.loginState) {
      localStorage.clear()
    }
    this.devices = JSON.parse(localStorage.getItem('devices')) || []
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
