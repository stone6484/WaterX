<script setup lang="ts">
import { ref } from 'vue'
import WaterXLogin from '../components/waterx/WaterXLogin.vue'
const username = ref('')
const password = ref('')
const notice = ref('风格预览 · 不连接登录接口，请勿输入真实密码。')
function preview() {
  notice.value = '已演示提交动作；没有发送、记录或验证账号密码。'
  password.value = ''
}
</script>

<template><WaterXLogin v-model:username="username" v-model:password="password" :preview-note="notice" @submit="preview" /></template>
