<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { WxButton } from '../../components/waterx'
import { createDemoRenderer, topics as demoTopics } from './demo-renderer.js'
import './cockpit.css'
import {createIdleCarousel} from './idle-carousel.js'
const topics=[['workbench','个人工作台'],...demoTopics] as const
const root=ref<HTMLElement>(),content=ref<HTMLElement>(),topic=ref('workbench'),fullscreen=ref(false)
const renderer=createDemoRenderer(),html=ref(''),filters=ref<Record<string,string>>({}),tip=ref(''),tipX=ref(0),tipY=ref(0),notice=ref('')
let observer:ResizeObserver|undefined
let generation=0
const carousel=createIdleCarousel({canRun:()=>fullscreen.value&&!document.hidden,advance:()=>{const i=topics.findIndex(t=>t[0]===topic.value);topic.value=topics[(i+1)%topics.length]![0]}})
watch(fullscreen,()=>carousel.reset())
const activityEvents=['pointermove','click','wheel','keydown'] as const
async function render(){
  const ticket=++generation
  observer?.disconnect();tip.value=''
  if(topic.value==='workbench'){html.value='';return}
  html.value=renderer.render(topic.value,filters.value);await nextTick()
  if(ticket!==generation||!content.value)return
  const sizes=new WeakMap<Element,string>()
  observer=new ResizeObserver(entries=>{for(const entry of entries){
    const svg=entry.target as SVGElement,w=Math.round(entry.contentRect.width),h=Math.round(entry.contentRect.height),key=w+'x'+h
    if(w<100||h<60||sizes.get(svg)===key)continue
    sizes.set(svg,key);const markup=renderer.resize(svg.dataset.chart||'',w,h);if(!markup)continue
    // Renderer accepts fixed local demonstration values only, never user/server HTML.
    const parsed=new DOMParser().parseFromString(markup,'image/svg+xml').documentElement
    svg.setAttribute('viewBox',parsed.getAttribute('viewBox')||'');svg.innerHTML=parsed.innerHTML
  }})
  content.value?.querySelectorAll('.chart').forEach(el=>observer?.observe(el))
}
watch(topic,render)
function click(event:MouseEvent){const button=(event.target as Element).closest<HTMLButtonElement>('button');if(!button)return;for(const key of ['waterPeriod','pollutant','safetyView','businessView'])if(button.dataset[key]!==undefined){filters.value[key]=button.dataset[key]!;void render();break}}
async function keyboard(event:KeyboardEvent){if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const i=topics.findIndex(t=>t[0]===topic.value);const next=event.key==='Home'?0:event.key==='End'?topics.length-1:(i+(event.key==='ArrowRight'?1:topics.length-1))%topics.length;topic.value=topics[next]![0];await nextTick();root.value?.querySelector<HTMLButtonElement>('#mc-tab-'+topic.value)?.focus()}
function pointer(event:PointerEvent){const el=(event.target as Element).closest<HTMLElement>('[data-tip]');tip.value=el?.dataset.tip||'';tipX.value=Math.max(8,Math.min(event.clientX+12,window.innerWidth-245));tipY.value=Math.max(8,Math.min(event.clientY+12,window.innerHeight-90))}
async function toggleFullscreen(){if(fullscreen.value){if(document.fullscreenElement===root.value)await document.exitFullscreen();fullscreen.value=false;notice.value='';return}fullscreen.value=true;try{await root.value?.requestFullscreen()}catch{notice.value='当前浏览器使用专注布局，按 Esc 或退出全屏返回。'}}
function syncFullscreen(){fullscreen.value=document.fullscreenElement===root.value}
function escape(event:KeyboardEvent){if(event.key==='Escape'&&fullscreen.value&&!document.fullscreenElement){fullscreen.value=false;notice.value=''}}
onMounted(()=>{void render();activityEvents.forEach(event=>root.value?.addEventListener(event,carousel.reset,{capture:true,passive:true}));document.addEventListener('visibilitychange',carousel.reset);document.addEventListener('fullscreenchange',syncFullscreen);document.addEventListener('keydown',escape)})
onBeforeUnmount(()=>{carousel.dispose();activityEvents.forEach(event=>root.value?.removeEventListener(event,carousel.reset,true));document.removeEventListener('visibilitychange',carousel.reset);if(document.fullscreenElement===root.value)void document.exitFullscreen().catch(()=>{});generation++;observer?.disconnect();document.removeEventListener('fullscreenchange',syncFullscreen);document.removeEventListener('keydown',escape)})
</script>
<template>
<section ref="root" class="management-hub" :class="{'management-cockpit':topic!=='workbench','is-workbench':topic==='workbench','is-fullscreen':fullscreen}" @pointermove="pointer" @pointerleave="tip=''">
  <div class="topic-bar"><div class="tabs" role="tablist" aria-label="管理驾驶舱专题" @keydown="keyboard"><button v-for="[id,name] in topics" :id="'mc-tab-'+id" :key="id" class="tab" :class="{active:topic===id}" role="tab" :aria-selected="topic===id" aria-controls="mc-board" :tabindex="topic===id?0:-1" @click="topic=id">{{name}}</button></div><WxButton @click="toggleFullscreen">{{fullscreen?'退出全屏':'全屏'}}</WxButton></div>
  <div v-if="topic==='workbench'" id="mc-board" class="workbench-board" role="tabpanel" aria-labelledby="mc-tab-workbench"><slot name="workbench" /></div>
  <template v-else>
    <div id="mc-board" ref="content" class="mc-content" role="tabpanel" :data-topic="topic" :aria-labelledby="'mc-tab-'+topic" @click="click" v-html="html"></div>
  </template>
  <span v-if="notice" class="mc-fullscreen-notice" role="status">{{notice}}</span>
  <div v-if="tip" class="mc-tooltip" :style="{left:tipX+'px',top:tipY+'px'}" role="tooltip">{{tip}}</div>
</section>
</template>
<style scoped>
.management-hub{min-width:0;container-type:inline-size;display:flex;flex-direction:column}
.management-hub>.topic-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;border-bottom:1px solid var(--wx-n200);margin-bottom:12px}
.management-hub .tabs{display:flex;flex:1;flex-wrap:wrap;gap:2px;min-width:0}
.management-hub .tab{flex:1;position:relative;min-height:36px;padding:8px 5px;border:0;background:transparent;font:inherit;font-size:12px;white-space:nowrap;color:var(--wx-n500);cursor:pointer}
.management-hub .tab.active{font-weight:600;color:var(--wx-blue-700);background:var(--wx-info-bg)}
.management-hub .tab.active:after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:3px;border-radius:2px;background:var(--wx-blue-500)}
.management-hub .tab:focus-visible{outline:2px solid var(--wx-blue-500);outline-offset:2px}
.management-hub.is-workbench{height:auto;min-height:0;max-width:none;margin:0;padding:0}
.workbench-board{min-height:0;flex:1;display:flex;flex-direction:column}
@media(min-width:850px) and (min-height:700px){.management-hub.is-workbench{height:calc(100dvh - 108px)}}
.management-hub.is-fullscreen,.management-hub:fullscreen{position:fixed;inset:0;z-index:10000;max-width:none;margin:0;padding:14px;height:100dvh;overflow:auto;background:var(--wx-n50)}
.management-hub.is-fullscreen>.topic-bar{position:sticky;top:0;z-index:20;flex-shrink:0;background:var(--wx-n50)}
.mc-fullscreen-notice{font-size:11px;color:var(--wx-n500)}
@container(max-width:900px){.management-hub .tabs{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));flex-basis:80%}.management-hub .tab{font-size:11px;min-height:30px;padding:5px 3px}}
@container(max-width:650px){.management-hub .tabs{grid-template-columns:repeat(4,minmax(0,1fr))}}
</style>
