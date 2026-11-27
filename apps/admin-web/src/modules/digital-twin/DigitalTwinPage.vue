<script setup lang="ts">
import {nextTick,onMounted,onBeforeUnmount,ref} from 'vue'
import {WxState} from '../../components/waterx'
import markup from './scene.html?raw'
import {mountTwin,type TwinInstance} from './runtime'
import './digital-twin.css'

import type {ApiClient} from '@safety/api-client'

const props=defineProps<{siteId:string;userId:string;api:ApiClient}>()
const emit=defineEmits<{ exhibit: [name: string] }>()
const loading=ref(true)
const scene=ref('')
const controller=new AbortController()
const host=ref<HTMLElement|null>(null)
const error=ref('')
let instance:TwinInstance|undefined
onMounted(async()=>{
  if(!props.siteId||!props.userId){error.value='请先登录并选择已授权的项目。';return}
  try{
    const saved=await props.api.forSite(props.siteId).projectTwinScene(controller.signal)
    if(controller.signal.aborted)return
    scene.value=saved?.html || ''
    loading.value=false
    if(saved){
      if(saved.displayProject)emit('exhibit',saved.displayProject)
      return
    }
    await nextTick()
    if(controller.signal.aborted || !host.value)return
    instance=mountTwin(host.value,{
      storageKey:`waterx:twin:demo:v1:${encodeURIComponent(props.siteId)}:${encodeURIComponent(props.userId)}`,
      context:{siteId:props.siteId,userId:props.userId},
    })
  }catch(e){
    if(controller.signal.aborted)return
    error.value=(e as {status?:number})?.status===403
      ? '当前账号没有此项目场景的查看权限。'
      : '项目场景读取失败，请返回后重新进入。'
  }
})
onBeforeUnmount(()=>{controller.abort();instance?.dispose()})
</script>
<template>
  <section class="digital-twin" aria-label="项目数字孪生">
    <WxState v-if="error" kind="error" compact>{{error}}</WxState>
    <!-- Trusted accepted local template only; never insert API or user HTML here. -->
    <p v-else-if="loading" role="status">正在读取当前项目场景…</p>
    <iframe v-else-if="scene" class="project-scene" title="青山湖厂区三维场景" sandbox="allow-scripts" allow="fullscreen" :srcdoc="scene" />
    <div v-else ref="host" class="twin-host" v-html="markup"></div>
  </section>
</template>

<style scoped>
.project-scene{display:block;flex:1;width:100%;min-height:0;border:0}
</style>
