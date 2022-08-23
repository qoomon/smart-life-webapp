<template>
  <div id="nav">
    <el-form v-if="!loginState" :model="loginForm" :inline="true">
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
          <el-button type="default" circle size="large"
            class="trigger"
            @click="triggerScene(device);"
          ><i class="material-icons-round">play_arrow</i></el-button>
        </template>
        <template v-else>
          <el-button type="default" circle size="large"
            :class="device.data.state ? 'state-on' : 'state-off'"
            :disabled="!device.data.online"
            @click="toggleDevice(device);"
          ><i class="material-icons-round">{{ device.data.online ? 'power_settings_new' : 'cloud_off' }}</i></el-button>
        </template>
      </el-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>

<script setup="" >
/* eslint-disable no-unused-vars */
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from "element-plus"

import tuya from '@/libs/tuya'

const homeAssistantClient = new tuya.HomeAssistantClient(
  JSON.parse(localStorage.getItem('session'))
)

const loginState = ref(false)
const devices = ref([])

const devicesSorted = computed(() => {
  const order = { true: 0, undefined: 1, false: 2 }
  return devices.value.slice().sort((d1, d2) =>
    order[d1.data.online] > order[d2.data.online] ? 1 : -1
  )
})

const loginForm = ref({ username: '', password: '' })

onMounted(async () => {
  // TODO handle expired session
  loginState.value = !!homeAssistantClient.getSession()
  if (!loginState.value) {
    localStorage.clear()
  }
  devices.value = JSON.parse(localStorage.getItem('devices')) || []
})

const login = async () => {
  try {
    await homeAssistantClient.login(
      loginForm.value.username,
      loginForm.value.password
    )
    localStorage.setItem('session', JSON.stringify(homeAssistantClient.getSession()))
    loginState.value = true
    loginForm.value = { username: '', password: '' }
    refreshDevices()
  } catch (err) {
    ElMessage.error(`Oops, login error. (${err})`)
  }
}

const logout = () => {
  homeAssistantClient.dropSession()
  localStorage.clear()
  loginState.value = false
  loginForm.value = { username: '', password: '' }
  devices.value = []
}

const refreshDevices = async () => {
  // TODO handle expired session
  try {
    const discoveryResponse = await homeAssistantClient.deviceDiscovery()
    const discoveryDevices = discoveryResponse.payload.devices || []
    devices.value = discoveryDevices
    localStorage.setItem('devices', JSON.stringify(discoveryDevices))
  } catch (err) {
    ElMessage.error(`Oops, device discovery error. (${err})`)
  }
}

const toggleDevice = async (device) => {
  // TODO handle expired session
  // TODO change icon to el-icon-loading
  try {
    const newState = !device.data.state
    await homeAssistantClient.deviceControl(device.id, 'turnOnOff', newState)
    device.data.state = newState
  } catch (err) {
    ElMessage.error(`Oops, device control error. (${err})`)
  }
}

const triggerScene = async (device) => {
  // TODO handle expired session
  // TODO change icon to el-icon-loading
  try {
    await homeAssistantClient.deviceControl(device.id, 'turnOnOff', true)
  } catch (err) {
    ElMessage.error(`Oops, device control error. (${err})`)
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
.el-card.device :deep(.el-card__body) {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}
.el-card.device :deep(.el-card__body :last-child) {
  margin-left: auto;
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
.el-button.el-button--large {
  padding: 9px;
  font-size: 20px;
  line-height: 0px;
}


.el-avatar {
  background: transparent;
  margin-right: 16px;
}
</style>
