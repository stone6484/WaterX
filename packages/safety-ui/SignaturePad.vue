<script setup lang="ts">
import { ref, watch } from 'vue'
const emit=defineEmits<{ 'update:modelValue':[value:string] }>()
const props=defineProps<{modelValue:string}>()
const canvas=ref<HTMLCanvasElement|null>(null)
let drawing=false,points=0
function position(e:PointerEvent){const c=canvas.value!,r=c.getBoundingClientRect();return {x:(e.clientX-r.left)*c.width/r.width,y:(e.clientY-r.top)*c.height/r.height}}
function start(e:PointerEvent){const c=canvas.value!,ctx=c.getContext('2d')!,p=position(e);c.setPointerCapture(e.pointerId);drawing=true;points=0;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.strokeStyle='#263746';ctx.lineWidth=2.5;ctx.lineCap='round'}
function move(e:PointerEvent){if(!drawing)return;const p=position(e),ctx=canvas.value!.getContext('2d')!;ctx.lineTo(p.x,p.y);ctx.stroke();points++}
function end(){if(!drawing)return;drawing=false;if(points>2)emit('update:modelValue',canvas.value!.toDataURL('image/png'))}
function clear(){canvas.value?.getContext('2d')?.clearRect(0,0,600,160);emit('update:modelValue','')}
watch(()=>props.modelValue,value=>{if(!value){drawing=false;canvas.value?.getContext('2d')?.clearRect(0,0,600,160)}})
</script>
<template>
  <div class="safety-signature"><span>本人手写确认</span><canvas ref="canvas" width="600" height="160" aria-label="本人手写签字区域，请使用鼠标或触屏签字" @pointerdown="start" @pointermove="move" @pointerup="end" @pointercancel="end"/><div><small>{{modelValue?'已填写，保存时绑定本次内容与本人身份':'请在上方签字；需纸质原件的场景继续留存原件'}}</small><button type="button" @click="clear">重签</button></div></div>
</template>
<style scoped>
.safety-signature{display:grid;gap:6px}.safety-signature canvas{width:100%;height:120px;border:var(--wx-border-default);border-radius:4px;background:var(--wx-n0);touch-action:none}.safety-signature>div{display:flex;justify-content:space-between;gap:12px}.safety-signature small{color:var(--wx-n500)}.safety-signature button{width:auto;padding:3px 10px;color:var(--wx-blue-700);background:var(--wx-n0);border:var(--wx-border-default);border-radius:4px}
</style>
