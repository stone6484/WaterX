<script setup lang="ts">
import {onMounted,onBeforeUnmount,ref} from 'vue'
import {WxState} from '../../components/waterx'
import markup from './scene.html?raw'
import {mountTwin,type TwinInstance} from './runtime'
import './digital-twin.css'

const props=defineProps<{siteId:string;userId:string}>()
const host=ref<HTMLElement|null>(null)
const error=ref('')
let instance:TwinInstance|undefined
onMounted(()=>{
  if(!host.value||!props.siteId||!props.userId){error.value='请先登录并选择已授权的项目。';return}
  try{
    instance=mountTwin(host.value,{
      storageKey:`waterx:twin:demo:v1:${encodeURIComponent(props.siteId)}:${encodeURIComponent(props.userId)}`,
      context:{siteId:props.siteId,userId:props.userId},
    })
  }catch{error.value='数字孪生示范页面加载失败，请返回后重新进入。'}
})
onBeforeUnmount(()=>instance?.dispose())
</script>
<template>
  <section class="digital-twin" aria-label="数字孪生示范">
    <WxState v-if="error" kind="error" compact>{{error}}</WxState>
    <!-- Trusted accepted local template only; never insert API or user HTML here. -->
    <div ref="host" class="twin-host" v-html="markup"></div>
  </section>
</template>
