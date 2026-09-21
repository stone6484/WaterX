import test from 'node:test'
import assert from 'node:assert/strict'
import {createIdleCarousel} from './idle-carousel.js'
test('5-second idle rotation, activity reset, hidden/offscreen pause, disposal',()=>{
 let now=0,id=0,full=false,hidden=false,topic=0;const timers=new Map()
 const tick=ms=>{const until=now+ms;while(true){const due=[...timers].filter(([,t])=>t.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;now=due[1].at;timers.delete(due[0]);due[1].fn()}now=until}
 const c=createIdleCarousel({advance:()=>topic=(topic+1)%12,canRun:()=>full&&!hidden,setTimer:(fn,ms)=>{timers.set(++id,{fn,at:now+ms});return id},clearTimer:id=>timers.delete(id)})
 c.reset();tick(6000);assert.equal(topic,0);assert.equal(timers.size,0)
 full=true;c.reset();tick(4999);assert.equal(topic,0);tick(1);assert.equal(topic,1)
 tick(4000);c.reset();tick(4999);assert.equal(topic,1);tick(1);assert.equal(topic,2)
 tick(50000);assert.equal(topic,0);assert.equal(timers.size,1)
 hidden=true;c.reset();tick(15000);assert.equal(topic,0);assert.equal(timers.size,0)
 hidden=false;c.reset();tick(4999);assert.equal(topic,0);tick(1);assert.equal(topic,1)
 full=false;c.reset();tick(15000);assert.equal(topic,1);assert.equal(timers.size,0)
 full=true;c.reset();c.dispose();c.reset();tick(15000);assert.equal(topic,1);assert.equal(timers.size,0)
})
