<script setup lang="ts">
import {ref,nextTick,onMounted,onBeforeUnmount} from 'vue'
import {createOverviewRenderer,observeOverview} from './renderer.js'
import './overview.css'
const root=ref<HTMLElement>(),content=ref<HTMLElement>(),html=ref(''),fullscreen=ref(false)
const renderer=createOverviewRenderer()
let disconnect:(()=>void)|undefined,generation=0
async function render(){
  const ticket=++generation;disconnect?.();html.value=renderer.render(fullscreen.value)
  await nextTick();if(ticket===generation&&content.value)disconnect=observeOverview(content.value)
}
async function toggleFullscreen(){
  if(fullscreen.value){if(document.fullscreenElement===root.value)await document.exitFullscreen();fullscreen.value=false}
  else{fullscreen.value=true;try{await root.value?.requestFullscreen()}catch{/* Keep an escapable full-window layout when native fullscreen is unavailable. */}}
  await render()
}
async function activate(event:MouseEvent|KeyboardEvent){
  const el=(event.target as Element).closest<HTMLElement>('[data-ov-focus],[data-ov-pollutant],[data-ov-scale],[data-ov-fullscreen]')
  if(!el)return
  if(event instanceof KeyboardEvent){if(!['Enter',' '].includes(event.key)||el.tagName.toLowerCase()!=='g')return;event.preventDefault()}
  if(el.hasAttribute('data-ov-fullscreen')){await toggleFullscreen();return}
  const key=['focus','pollutant','scale'].find(k=>el.hasAttribute('data-ov-'+k));if(!key)return
  const value=el.getAttribute('data-ov-'+key)!;renderer.select(key,value);await render()
  Array.from(content.value?.querySelectorAll<HTMLElement>('[data-ov-'+key+']')||[]).find(n=>n.getAttribute('data-ov-'+key)===value)?.focus({preventScroll:true})
}
function sync(){fullscreen.value=document.fullscreenElement===root.value;void render()}
function escape(event:KeyboardEvent){if(event.key==='Escape'&&fullscreen.value&&!document.fullscreenElement){fullscreen.value=false;void render()}}
onMounted(()=>{void render();document.addEventListener('fullscreenchange',sync);document.addEventListener('keydown',escape)})
onBeforeUnmount(()=>{generation++;disconnect?.();document.removeEventListener('fullscreenchange',sync);document.removeEventListener('keydown',escape);if(document.fullscreenElement===root.value)void document.exitFullscreen().catch(()=>{})})
</script>
<template>
  <section ref="root" class="process-parameters" :class="{'is-fullscreen':fullscreen}" aria-label="工艺参数概览（固定示例）">
    <!-- Only trusted fixed-data renderer output, never user or API HTML. -->
    <div ref="content" class="ov-content" @click="activate" @keydown="activate" v-html="html"></div>
  </section>
</template>
