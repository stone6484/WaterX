// Local preview navigation only; no production routes or device controls.
const shellToggle=document.getElementById('sidebarToggle');
shellToggle.addEventListener('click',()=>{const collapsed=document.body.classList.toggle('collapsed');shellToggle.setAttribute('aria-label',collapsed?'展开导航':'收起导航');});
