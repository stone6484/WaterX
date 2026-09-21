// One timer per mounted cockpit; no task actions or automatic focus changes.
export function createIdleCarousel({advance,canRun,setTimer=setTimeout,clearTimer=clearTimeout}){
  let timer,disposed=false
  function stop(){if(timer!==undefined)clearTimer(timer);timer=undefined}
  function reset(){stop();if(!disposed&&canRun())timer=setTimer(()=>{timer=undefined;if(!disposed&&canRun()){advance();reset()}},5000)}
  return {reset,stop,dispose(){disposed=true;stop()}}
}
