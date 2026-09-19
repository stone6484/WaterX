import THREE from './vendor/three.module.js'
import {D,createSimulation} from './simulation.js'

/** Fixed demo only. No API requests, production controls or real-object assumptions. */
export function mountTwin(host,options){
let cleanup=()=>{};
try{return createTwin(host,{...options,registerCleanup:fn=>cleanup=fn});}
catch(error){cleanup();throw error;}
}
function createTwin(host,options){
let disposed=false,frame=0,observer;
let scene,camera,renderer,root,highlight;
const textureCache=new Map(),keys=new Set();
const listeners=[],timers=new Set(),urls=new Set();
function on(target,event,handler,opts){target.addEventListener(event,handler,opts);listeners.push(()=>target.removeEventListener(event,handler,opts));}
function later(fn,ms){const id=window.setTimeout(()=>{timers.delete(id);if(!disposed)fn()},ms);timers.add(id);return id;}
function cancelTimer(id){window.clearTimeout(id);timers.delete(id);}
function releaseGraphics(){
 observer?.disconnect();cancelAnimationFrame(frame);
 const geometries=new Set(),materials=new Set(),textures=new Set(textureCache.values());
 scene?.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:o.material?[o.material]:[])){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v)}if(o.isInstancedMesh)o.dispose();o.shadow?.dispose();});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
 renderer?.renderLists.dispose();renderer?.dispose();renderer?.forceContextLoss();renderer?.domElement.remove();renderer=null;scene=null;camera=null;textureCache.clear();
}
function dispose(){if(disposed)return;disposed=true;listeners.forEach(off=>off());listeners.length=0;timers.forEach(id=>window.clearTimeout(id));timers.clear();urls.forEach(url=>URL.revokeObjectURL(url));urls.clear();keys.clear();$('businessDialog')?.close();releaseGraphics();host.replaceChildren();}
const $=id=>host.querySelector('#'+id);
options.registerCleanup(dispose);
const entities=new Map([...D.facilities,...D.equipment].map(x=>[x.id,x]));
const kindNames={facility:'构筑物 / 建筑',equipment:'设备 / 仪表'};
let selected=null,tab='asset',scenario='alerts',tick=0,cut=false,showLabels=true,mode='orbit',tourIndex=0;
let records=[];const storageKey=options.storageKey;
try{const old=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(old))records=old.filter(r=>r&&typeof r.object==='string'&&Array.isArray(r.checks));}catch{}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const row=(a,b)=>`<div><dt>${escape(a)}</dt><dd>${escape(b)}</dd></div>`;
function notify(msg){$('toast').textContent=msg;$('toast').style.display='block';cancelTimer(notify.timer);notify.timer=later(()=>$('toast').style.display='none',3500);}
const simulation=createSimulation();
const {currentTime,status,signalValue,displaySignal,activeRisks,riskValue}=simulation;
function riskDetail(a){if(!a)return '';const relevant=activeRisks().filter(r=>r.object===a.id||r.location===a.id);return relevant.map(r=>`<section class="risk-detail ${r.level}"><strong>${r.level==='alarm'?'告警':'预警'} · ${escape(r.title)}</strong><b>${escape(riskValue(r))}</b><p>${escape(r.impact)}</p><dl><dt>触发依据</dt><dd>${escape(r.basis)}</dd><dt>关联信号</dt><dd>${escape(r.signal)}</dd><dt>核验方向</dt><dd>${escape(r.focus)}</dd></dl><small>模拟时刻 ${currentTime().slice(11)} · 未接真实报警系统</small></section>`).join('');}
function focusRisk(r){tab='signals';host.querySelectorAll('[data-tab]').forEach(b=>{const on=b.dataset.tab===tab;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));});select(r.object,true);$('detailContent').scrollTop=0;}
function renderRiskPanel(){const risks=activeRisks(),alarms=risks.filter(r=>r.level==='alarm').length,warnings=risks.length-alarms;
 const severity=alarms?'alarm':warnings?'warning':'normal',summary=alarms?`告警 ${alarms} 项，预警 ${warnings} 项`:warnings?`预警 ${warnings} 项`:'无风险提示';$('riskReveal').dataset.severity=severity;$('riskReveal').setAttribute('aria-label','展开风险提示：'+summary);$('riskReveal').title=summary;
 $('riskCounts').innerHTML=`<span class="risk-count ${alarms?'alarm':''}">告警 <b>${alarms}</b></span><span class="risk-count ${warnings?'warning':''}">预警 <b>${warnings}</b></span>`;
 $('riskList').innerHTML='';for(const r of risks){const b=document.createElement('button');b.className='risk-row '+r.level;b.dataset.risk=r.id;b.innerHTML=`<span class="risk-dot" aria-hidden="true"></span><span class="risk-row-copy"><strong>${escape(r.title)}</strong><span>${escape(riskValue(r))}</span></span><small>${r.level==='alarm'?'告警':'预警'}</small>`;b.setAttribute('aria-label',`${r.level==='alarm'?'告警':'预警'}：${r.title}，${riskValue(r)}，定位并查看`);b.onclick=()=>focusRisk(r);$('riskList').append(b);}
 if(!risks.length)$('riskList').innerHTML='<p class="risk-empty">当前模拟情景无触发事件</p>';
 $('riskFoot').textContent=risks.length?`${currentTime().slice(11)} · 点击定位对象 · 阈值仅为演示设定`:'正常情景仅用于对照，不代表真实厂区安全状态';
 if(scene)syncRiskMarkers(risks);
}
function closeProcessMenus(){host.querySelectorAll('.process-group').forEach(g=>{g.querySelector('.process-trigger').setAttribute('aria-expanded','false');g.querySelector('.process-dropdown').hidden=true;});}
function openProcessMenu(group){closeProcessMenus();const panel=group.querySelector('.process-dropdown');panel.hidden=false;group.querySelector('.process-trigger').setAttribute('aria-expanded','true');panel.style.left='0px';const r=panel.getBoundingClientRect();panel.style.left=Math.min(0,window.innerWidth-r.right-12)+'px';}
function bindProcessMenu(group){const trigger=group.querySelector('.process-trigger'),panel=group.querySelector('.process-dropdown');let timer;
   on(group,'pointerenter',e=>{if(e.pointerType==='mouse'){cancelTimer(timer);timer=later(()=>{if(group.matches(':hover'))openProcessMenu(group);},180);}});
   on(group,'pointerleave',()=>{cancelTimer(timer);timer=later(()=>{if(!group.contains(document.activeElement)){panel.hidden=true;trigger.setAttribute('aria-expanded','false');}},120);});
   trigger.onclick=()=>{cancelTimer(timer);openProcessMenu(group);};
   on(trigger,'keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();openProcessMenu(group);panel.querySelector('button,input')?.focus();}});
   on(group,'focusout',e=>{if(!group.contains(e.relatedTarget)){panel.hidden=true;trigger.setAttribute('aria-expanded','false');}});
   on(group,'keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeProcessMenus();trigger.focus();}});
}
bindProcessMenu($('layerMenu'));
function renderList(){const nav=$('processNav');
 if(!nav.children.length){
  for(const name of ['预处理','生化处理','二沉及回流','深度处理与消毒','污泥处理','辅助设施']){
   const group=document.createElement('div');group.className='process-group';group.dataset.group=name;
   const trigger=document.createElement('button');trigger.className='process-trigger';trigger.textContent=name+' ▾';trigger.setAttribute('aria-expanded','false');
   const panel=document.createElement('div');panel.className='process-dropdown';panel.id='process-menu-'+nav.children.length;panel.hidden=true;panel.setAttribute('aria-label',name+'设施与设备');trigger.setAttribute('aria-controls',panel.id);
   for(const f of D.facilities.filter(f=>f.group===name)){
    const block=document.createElement('div');block.className='process-facility';
    for(const a of [f,...D.equipment.filter(e=>e.parent===f.id)]){const button=document.createElement('button');button.className='process-object '+(a.type==='facility'?'facility-name':'equipment-name');button.dataset.id=a.id;button.textContent=a.name;button.onclick=()=>{closeProcessMenus();select(a.id,true);};block.append(button);}panel.append(block);
   }
   group.append(trigger,panel);nav.append(group);bindProcessMenu(group);
  }
 }
 const parent=selected?.type==='facility'?selected:entities.get(selected?.parent);
 nav.querySelectorAll('.process-group').forEach(g=>g.querySelector('.process-trigger').classList.toggle('current',parent?.group===g.dataset.group));
 nav.querySelectorAll('[data-id]').forEach(b=>{const on=b.dataset.id===selected?.id;b.classList.toggle('selected',on);if(on)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
}
on(document,'pointerdown',e=>{if(!host.querySelector('.process-selector').contains(e.target))closeProcessMenus();});
on(window,'resize',closeProcessMenus);
function signalsFor(a){if(!a)return D.signals.filter(s=>['PRE-01.IN_Q','OUT-01.COD','OUT-01.NH4','AIR-01.FLOW','PWR-01.POWER'].includes(s.id));return D.signals.filter(s=>s.owner===a.id||(a.type==='facility'&&D.equipment.some(e=>e.parent===a.id&&e.id===s.owner)&&['DO-','BL-'].some(prefix=>s.owner.startsWith(prefix))));}
function readingIds(a){
 if(!a)return [];
 if(a.kind==='blower')return ['RUN','FREQ','PRESSURE','TEMP','VIB'].map(k=>a.id+'.'+k);
 if(a.kind==='pump')return ['RUN','FREQ','CURRENT'].map(k=>a.id+'.'+k);
 if(a.kind==='sensor')return [a.id+'.VALUE',a.parent+'.MLSS',a.parent+'.TEMP'];
 if(a.kind==='bio')return ['DO-'+a.id.slice(-2)+'.VALUE',a.id+'.MLSS',a.id+'.ORP_A',a.id+'.ORP_N',a.id+'.IN_Q',a.id+'.NH4'];
 if(a.id==='AIR-01')return ['AIR-01.FLOW','BL-01.TEMP','BL-01.PRESSURE','BL-02.RUN'];
 if(a.id==='PRE-01')return ['PRE-01.IN_Q','PRE-01.LEVEL','PRE-01.PH','PRE-01.COD','PRE-01.NH4','PRE-01.H2S'];
 if(a.id==='OUT-01')return ['Q','COD','NH4','TN','TP','PH'].map(k=>a.id+'.'+k);
 return D.signals.filter(s=>s.owner===a.id).slice(0,4).map(s=>s.id);
}
function readingName(s){const tag=s.id.split('.').pop();return {MLSS:'MLSS',ORP_A:'厌氧 ORP',ORP_N:'缺氧 ORP',IN_Q:'进水流量',Q:'出水流量',PH:'pH',COD:'COD',NH4:'氨氮',TN:'总氮',TP:'总磷',RUN:'状态',FREQ:'频率',CURRENT:'电流',PRESSURE:'压力',TEMP:s.owner.startsWith('BL-')?'轴承温度':'水温',VIB:'振动',H2S:'H₂S',CL:'余氯',BLANKET:'泥位',FLOW:'供气流量'}[tag]||(s.owner.startsWith('DO-')?'DO':s.name);}
function renderReadings(){
 const risks=activeRisks();
 for(const l of labelEntries){const a=entities.get(l.id),signals=(l.signalIds||[]).map(id=>D.signals.find(s=>s.id===id)).filter(Boolean);
  l.el.innerHTML=`<strong>${escape(a.name)}</strong>${signals.length?`<span class="reading-stamp">模拟 ${currentTime().slice(11)}</span><span class="spatial-values">${signals.map(s=>{const value=signalValue(s),risk=risks.find(r=>r.signal===s.id),prefix=a.id!==s.owner&&s.owner.startsWith('BL-')?s.owner.slice(-1)+'号机 · ':'';return `<span class="spatial-value ${value===null?'offline':risk?.level||''}" data-signal="${escape(s.id)}"><span>${escape(prefix+readingName(s))}</span><b>${escape(s.unit==='无量纲'&&value!==null?Number(value).toFixed(2):displaySignal(s,value))}</b></span>`;}).join('')}</span>`:''}`;
  l.el.classList.toggle('with-reading',signals.length>0);l.width=0;l.height=0;
 }
}
function addSceneLabel(a){const el=document.createElement('button');el.className='map-label';el.type='button';el.dataset.object=a.id;el.setAttribute('aria-label','定位 '+a.name);el.onclick=()=>select(a.id,true);$('sceneLabels').append(el);const leader=document.createElementNS('http://www.w3.org/2000/svg','path');$('readingLeaders').append(leader);const equipment=a.type==='equipment';labelEntries.push({id:a.id,el,leader,equipment,signalIds:readingIds(a),width:0,height:0,pos:new THREE.Vector3(a.x,equipment?(a.y||0)+2:['building','admin'].includes(a.kind)?a.h+1:2,a.z)});}
let drawerPinned=true,drawerTimer;
function setDrawer(open,pinned=false){cancelTimer(drawerTimer);drawerPinned=open&&pinned;const drawer=$('detailDrawer');drawer.classList.toggle('open',open);drawer.inert=!open;$('detailReveal').hidden=open;$('detailReveal').setAttribute('aria-expanded',String(open));$('pinDetails').setAttribute('aria-pressed',String(drawerPinned));$('pinDetails').classList.toggle('active',drawerPinned);$('pinDetails').textContent=drawerPinned?'已固定':'固定';}
on($('detailReveal'),'pointerenter',e=>{if(e.pointerType==='mouse')setDrawer(true,drawerPinned);});
$('detailReveal').onclick=e=>{setDrawer(true,false);if(e.detail===0)$('pinDetails').focus({preventScroll:true});};

on($('detailDrawer'),'pointerenter',()=>cancelTimer(drawerTimer));
function scheduleDrawerClose(){cancelTimer(drawerTimer);drawerTimer=later(()=>{const drawer=$('detailDrawer'),entry=$('detailReveal');if(!drawerPinned&&!drawer.contains(document.activeElement)&&document.activeElement!==entry&&!drawer.matches(':hover')&&!entry.matches(':hover'))setDrawer(false);},400);}
on($('detailDrawer'),'pointerleave',scheduleDrawerClose);
on($('detailReveal'),'pointerleave',scheduleDrawerClose);
on($('detailDrawer'),'focusout',scheduleDrawerClose);
on($('detailReveal'),'blur',scheduleDrawerClose);
$('pinDetails').onclick=e=>{setDrawer(true,!drawerPinned);if(e.detail)e.currentTarget.blur();};
$('closeDetails').onclick=()=>{setDrawer(false);$('viewport').focus({preventScroll:true});};
on($('detailDrawer'),'keydown',e=>{if(e.key==='Escape'){$('closeDetails').click();}});
let riskPinned=true,riskTimer;
function setRiskPanel(open,pinned=false){cancelTimer(riskTimer);riskPinned=open&&pinned;const panel=$('riskPanel');panel.classList.toggle('open',open);panel.inert=!open;$('riskReveal').hidden=open;$('riskReveal').setAttribute('aria-expanded',String(open));$('pinRisk').setAttribute('aria-pressed',String(riskPinned));$('pinRisk').classList.toggle('active',riskPinned);$('pinRisk').textContent=riskPinned?'已固定':'固定';}
function scheduleRiskClose(){cancelTimer(riskTimer);riskTimer=later(()=>{const panel=$('riskPanel');if(!riskPinned&&!panel.matches(':hover')&&!panel.contains(document.activeElement))setRiskPanel(false);},400);}
$('riskReveal').onclick=e=>{setRiskPanel(true,false);if(e.detail===0)$('pinRisk').focus({preventScroll:true});};
on($('riskPanel'),'pointerenter',()=>cancelTimer(riskTimer));
on($('riskPanel'),'pointerleave',scheduleRiskClose);
on($('riskPanel'),'focusout',scheduleRiskClose);
$('pinRisk').onclick=e=>{setRiskPanel(true,!riskPinned);if(e.detail)e.currentTarget.blur();};
$('closeRisk').onclick=()=>{setRiskPanel(false);$('riskReveal').focus({preventScroll:true});};
on($('riskPanel'),'keydown',e=>{if(e.key==='Escape')$('closeRisk').click();});
function spark(s){const vals=Array.from({length:25},(_,i)=>signalValue(s,i));if(vals.some(v=>v===null)||s.io!=='AI')return '';const lo=Math.min(...vals),hi=Math.max(...vals),range=hi-lo||1;const pts=vals.map((v,i)=>`${i*10},${29-(v-lo)/range*23}`).join(' ');const x=tick*10,y=29-(vals[tick]-lo)/range*23;return `<svg viewBox="0 0 240 34" role="img" aria-label="08:00 至 14:00 的模拟变化趋势，纵轴自动缩放"><path d="M0 31H240" stroke="#e8f0f4" fill="none"/><polyline points="${pts}" fill="none" stroke="#078bc4" stroke-width="1.5"/><circle cx="${x}" cy="${y}" r="2.7" fill="#0877a7"/></svg>`;}
function renderDetail(){const a=selected;renderReadings();
 $('detailKind').textContent=a?kindNames[a.type]:'全厂概览';$('detailTitle').textContent=a?.name||D.meta.name;$('detailCode').textContent=a?.id||D.meta.id;
 const content=$('detailContent');
 if(tab==='asset'){
  if(!a){content.innerHTML=`<p class="intro">一座可以走近、查看和巡检的假想 A²/O 水厂。</p><dl class="kv">${row('处理规模','100,000 m³/d')}${row('生化池组','4 组 × 25,000 m³/d')}${row('占地假设','420 × 280 m')}${row('设施 / 设备',`${D.facilities.length} / ${D.equipment.length}`)}${row('模拟信号',D.signals.length+' 项')}</dl><div class="subheading">浏览方式</div><p class="intro">点击池体进入工艺单元，点击设备查看台账。选择“巡检路线”，逐站核查并保存本地记录。</p><div class="note">工艺关系参考公开资料；总图、尺寸、设备参数均为示范设定。</div><a href="/digital-twin/scenario.html" target="_blank" rel="noopener">查看完整案例与来源 ↗</a>`;return;}
  const state=status(a);content.innerHTML=`<p class="intro">${escape(a.description)}</p><span class="status ${state.includes('故障')||state.includes('报警')?'alarm':state.includes('预警')?'warn':state==='离线'?'off':''}">${escape(state)}</span><dl class="kv">${a.parent?row('所属单元',entities.get(a.parent)?.name||a.parent):''}${Object.entries(a.params).map(([k,v])=>row(k,v)).join('')}${a.type==='equipment'?row('设备厂商',a.manufacturer)+row('示例型号',a.model)+row('投运日期',a.commissioned):''}</dl>`;
  const children=D.equipment.filter(e=>e.parent===a.id);if(children.length){content.insertAdjacentHTML('beforeend',`<div class="subheading">设备与测点 · ${children.length}</div>`);for(const child of children){const b=document.createElement('button');b.className='child-link';b.textContent=child.name+' ↗';b.onclick=()=>select(child.id,true);content.append(b);}}
  if(a.parent){const b=document.createElement('button');b.className='child-link';b.textContent='返回所属单元';b.onclick=()=>select(a.parent,true);content.append(b);}
 }else if(tab==='signals'){
  const signals=signalsFor(a);content.innerHTML=`<div class="note">模拟快照 · ${currentTime()}<br>曲线为预设波形，非实测或工艺预测。</div>`;
  if(!signals.length)content.insertAdjacentHTML('beforeend','<p class="intro">该对象没有独立信号。可在所属设备或其他工艺单元查看。</p>');
  for(const s of signals){const v=signalValue(s);content.insertAdjacentHTML('beforeend',`<div class="signal"><div class="signal-top"><span>${escape(s.name)}</span><b>${escape(displaySignal(s,v))}</b></div><div class="signal-code">${escape(s.id)} · ${s.io}${s.optional?' · 选配':''}</div>${spark(s)}</div>`);}
 }else{
  content.innerHTML='<p class="intro">查看与当前对象关联的示例业务资料。</p>';
  for(const [key,name,desc] of [['equipment','设备维护','台账、保养计划与示例维护记录'],['process','工艺运行','关联单元、运行数据与流程关系'],['safety','安全风险','作业风险与巡检关注事项'],['inspection','巡检记录','本浏览器保存的演示核查记录']]){
   const b=document.createElement('button');b.className='business-link';b.innerHTML=`<span>↗</span>${name}<small>${desc}</small>`;b.onclick=()=>openBusiness(key);content.append(b);
  }content.insertAdjacentHTML('beforeend','<div class="note">此处仅查看模拟资料。尚未建立当前项目的设施／设备稳定ID映射，正式业务详情未接入。</div>');
 }
 content.insertAdjacentHTML('afterbegin',riskDetail(a));
}
function openBusiness(key){const a=selected||{id:D.meta.id,name:D.meta.name},parent=a.parent?entities.get(a.parent):a;let body='';
 if(key==='equipment'){body=`<h3>${escape(a.name)} · 维护档案</h3><table class="dialog-table"><tr><th>条目</th><th>示例信息</th></tr><tr><td>所属对象</td><td>${escape(a.id)}</td></tr><tr><td>维护计划</td><td>日常巡视；周期保养按设备说明书配置</td></tr><tr><td>2026-09-12</td><td>例行检查 · 演示班组 · 示例记录</td></tr><tr><td>2026-10-01</td><td>计划保养 · 待执行（模拟）</td></tr></table><p class="note">维护日期与记录为固定样例，不证明真实设备完成保养。</p>`;}
 if(key==='process'){const ss=signalsFor(parent);body=`<h3>${escape(parent.name)} · 工艺运行</h3><p>${escape(parent.description||D.meta.description)}</p><table class="dialog-table"><tr><th>信号</th><th>模拟值</th><th>时刻</th></tr>${ss.slice(0,12).map(s=>`<tr><td>${escape(s.name)}</td><td>${escape(displaySignal(s,signalValue(s)))}</td><td>${currentTime().slice(11)}</td></tr>`).join('')}</table><h3>关联流路</h3><ul class="dialog-list">${D.pipes.filter(p=>p.start===parent.id||p.end===parent.id).map(p=>`<li>${escape(p.name)}：${escape(p.start)} → ${escape(p.end)}</li>`).join('')||'<li>在所属工艺单元查看流路。</li>'}</ul>`;}
 if(key==='safety'){body=`<h3>${escape(a.name)} · 示例风险提示</h3><ul class="dialog-list"><li>池边与高处通道：检查护栏、盖板与防滑。</li><li>转动设备：巡检不得接触运动部件；检修需按现场制度隔离能源。</li><li>井室及池内：进入前按有限空间作业制度履行审批与现场确认。</li><li>药剂设施：以实际药剂安全技术说明书与现场制度为准。</li></ul><p class="note">通用示例，不是该对象的正式风险辨识、作业票或安全许可。</p>`;}
 if(key==='inspection'){const related=records.filter(r=>!selected||r.object===a.id||entities.get(r.object)?.parent===a.id||a.parent===r.object);body=`<h3>${escape(a.name)} · 本地示例巡检</h3>${related.length?`<table class="dialog-table"><tr><th>时间</th><th>站点</th><th>核查与备注</th></tr>${related.map(r=>`<tr><td>${escape(r.savedAt)}</td><td>${escape(r.station)}</td><td>${r.checks.filter(Boolean).length}/3 项；${escape(r.note||'无备注')}</td></tr>`).join('')}</table>`:'<p>尚无对应记录。进入“巡检路线”，完成核查后保存。</p>'}`;}
 $('dialogTitle').textContent={equipment:'设备维护 · 示例',process:'工艺运行 · 示例',safety:'安全风险 · 示例',inspection:'巡检记录 · 本地'}[key];$('dialogBody').innerHTML=body;$('businessDialog').showModal();
}
$('closeDialog').onclick=()=>$('businessDialog').close();

host.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;host.querySelectorAll('[data-tab]').forEach(t=>{t.classList.toggle('active',t===b);t.setAttribute('aria-selected',String(t===b));});renderDetail();});
$('timeline').oninput=e=>{tick=Number(e.target.value);simulation.setTick(tick);$('timeLabel').textContent=currentTime();renderDetail();renderRiskPanel();};
$('scenario').onchange=e=>{scenario=e.target.value;simulation.setScenario(scenario);updateAppearance();renderDetail();renderRiskPanel();notify(scenario==='normal'?'已切换正常对照情景，模拟风险标记已清除。':'已切换风险示例，可点击主视图风险信息定位对象。');};
const objectGroups=new Map(),pickables=[],labelEntries=[],waterObjects=[],cutObjects=[],equipmentMats=new Map(),pipeGroups={},flowMarkers=[],riskMarkers=new Map(),waterAnimations=[],rotors=[];
let yaw=.60,pitch=.85,distance=620,target={x:0,y:0,z:0},walkYaw=0,walkPitch=0,transition=null,lastFrame=0;
let autoFit=true;
const colors={wall:0xc4d1d4,water:0x5faaa9,water2:0x78bbc4,metal:0x547a8c,concrete:0xdbdfe0,roof:0x527a8b,ground:0xdfe8df,road:0xc9d2d5};
function select(id,focus=false){const a=entities.get(id);if(!a)return;selected=a;renderList();renderDetail();if(!scene)return;
 if(highlight){scene.remove(highlight);highlight.geometry.dispose();highlight.material.dispose();}
 const group=objectGroups.get(id);if(group){highlight=new THREE.BoxHelper(group,0x078bc4);highlight.material.depthTest=false;highlight.renderOrder=8;scene.add(highlight);}
 if(a.type==='equipment'){setCut(true);}
 if(focus){setMode('orbit');autoFit=false;const size=a.type==='facility'?Math.max(a.w,a.d):a.kind==='blower'?19:12;target={x:a.x,y:a.type==='equipment'?a.y:0,z:a.z};distance=Math.max(size*(a.type==='facility'?1.85:2),24);pitch=.68;transition=null;updateCamera();}
}
// Procedural materials and geometry, visually informed by the references in README.
// No downloaded product models or third-party photographic textures are embedded.
function surfaceTexture(kind){if(textureCache.has(kind))return textureCache.get(kind);const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');let seed=1673;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 x.fillStyle=kind==='sludge'?'#8b7050':kind==='water'?'#72918e':kind==='road'?'#78838a':'#b6b6ac';x.fillRect(0,0,256,256);
 for(let i=0;i<6500;i++){const v=Math.floor(80+rnd()*150);x.fillStyle=kind==='sludge'?`rgba(${v+24},${v},${v*.66},${.08+rnd()*.23})`:`rgba(${v},${v},${v},${.04+rnd()*.14})`;const r=kind==='sludge'?1+rnd()*5:.4+rnd()*1.8;x.fillRect(rnd()*256,rnd()*256,r,r);}
 if(kind==='sludge'||kind==='water'){for(let i=0;i<260;i++){const a=rnd()*256,b=rnd()*256;x.beginPath();x.ellipse(a,b,3+rnd()*16,.5+rnd()*3,rnd()*2,0,Math.PI*1.6);x.strokeStyle=kind==='sludge'?'rgba(223,202,157,.22)':'rgba(218,237,233,.25)';x.lineWidth=.6+rnd();x.stroke();}}
 else if(kind==='concrete'){x.strokeStyle='#575e5c25';x.lineWidth=1;for(let a=0;a<256;a+=64){x.beginPath();x.moveTo(a,0);x.lineTo(a,256);x.stroke();}for(let y=0;y<256;y+=64){x.beginPath();x.moveTo(0,y);x.lineTo(256,y);x.stroke();}}
 const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;textureCache.set(kind,tex);return tex;
}
function waterSurface(g,x,z,w,d,y,kind){const muddy=kind==='bio'||kind==='sludgetank',map=surfaceTexture(muddy?'sludge':'water').clone();map.needsUpdate=true;map.repeat.set(w/12,d/10);const mat=new THREE.MeshStandardMaterial({color:muddy?0xa59176:kind==='pre'?0x7e8970:0x91b1aa,map,bumpMap:map,bumpScale:muddy?.12:.08,roughness:muddy?.48:.28,metalness:.12});const clock={value:0};mat.onBeforeCompile=shader=>{shader.uniforms.surfaceTime=clock;shader.vertexShader='uniform float surfaceTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.z += sin(position.x * 1.8 + surfaceTime) * cos(position.y * 1.4 + surfaceTime * 0.7) * 0.045;');};const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d,32,12),mat);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.receiveShadow=true;g.add(mesh);waterObjects.push(mesh);waterAnimations.push({map,clock});return mesh;}
function flange(g,x,y,z,r,axis='y'){const f=new THREE.Group();cylinder(f,0,0,0,r*1.45,.17,0xa5b2b4,24);cylinder(f,0,.095,0,r,.05,0x485960,24);for(let i=0;i<8;i++){const a=i*Math.PI/4;cylinder(f,Math.cos(a)*r*1.2,.14,Math.sin(a)*r*1.2,.075,.16,0xc5cbd0,6);}if(axis==='x')f.rotation.z=Math.PI/2;if(axis==='z')f.rotation.x=Math.PI/2;f.position.set(x,y,z);g.add(f);return f;}
function pipeDetail(g,pts,r=.4,color=0x9baaad){line(g,pts,color,r);for(let i=1;i<pts.length-1;i++){const p=pts[i];const s=new THREE.Mesh(new THREE.SphereGeometry(r,12,8),material(color,{metalness:.6,roughness:.32}));s.position.set(...p);g.add(s);}const a=pts[0],b=pts[1],axis=Math.abs(b[0]-a[0])>.01?'x':Math.abs(b[2]-a[2])>.01?'z':'y';flange(g,...a,r,axis);}
function gauge(g,x,y,z,label){const body=cylinder(g,x,y,z,.34,.17,0x85989e);body.rotation.x=Math.PI/2;const face=new THREE.Mesh(new THREE.CircleGeometry(.29,24),material(0xf7f4df,{roughness:.4}));face.position.set(x,y,z+.1);g.add(face);line(g,[[x,y,z+.13],[x+.13,y+.14,z+.13]],0x202c35,.023);}
function nameplate(g,text,x,y,z,w=1.6){const c=document.createElement('canvas');c.width=256;c.height=96;const q=c.getContext('2d');q.fillStyle='#153b4a';q.fillRect(0,0,256,96);q.strokeStyle='#739299';q.strokeRect(4,4,248,88);q.fillStyle='#e7f4f4';q.font='bold 29px sans-serif';q.textAlign='center';q.fillText(text,128,41);q.font='18px sans-serif';q.fillStyle='#88c2c4';q.fillText('WATERX · DEMO',128,71);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w*.375),new THREE.MeshBasicMaterial({map:tex}));m.position.set(x,y,z);g.add(m);}
function blowerModel(g,e,base){box(g,0,-1.65,0,8,.35,6,0xa8aaa5);box(g,0,-1.34,0,7.4,.25,5.4,0x344854);for(const x of [-2.9,2.9])for(const z of [-1.9,1.9]){cylinder(g,x,-1.48,z,.27,.35,0x292f32);cylinder(g,x,-1.19,z,.1,.16,0xa8b4b8,6);}
 // Acoustic enclosure, split panels, intake louvers and front controller.
 const main=box(g,0,.7,0,6.9,3.85,4.7,base,{roughness:.36,metalness:.4});box(g,0,2.69,0,7,.16,4.8,0xd2d9d9,{metalness:.5,roughness:.32});
 for(const x of [-2.1,0,2.1]){box(g,x,.7,2.38,2,3.65,.09,0xe1e5e1,{metalness:.28,roughness:.42});box(g,x+.7,.75,2.46,.065,.6,.08,0x3b515a);}
 for(let y=-.65;y<=.75;y+=.2)box(g,-2.1,y,2.45,1.7,.085,.08,0x3f5865);
 box(g,0,1.35,2.48,1.35,.85,.09,0x253b47);box(g,0,1.39,2.54,1.12,.58,.035,0x2d6774,{emissive:0x2e939d,emissiveIntensity:.22});for(let i=0;i<3;i++)box(g,-.4+i*.4,1.43,2.57,.24,.05,.02,0x89e1cb);
 const lamp=cylinder(g,.35,.65,2.53,.1,.08,e.status==='备用'?0x9aa1a5:0x4ec88c,12);lamp.rotation.x=Math.PI/2;main.userData.statusLamp=lamp;nameplate(g,e.id,2.1,1.3,2.47,1.55);
 pipeDetail(g,[[2,2.8,-.8],[2,5,-.8],[2,5,-5]],.65);flange(g,2,4.1,-.8,.65);const silencer=cylinder(g,-2,3.5,-1.1,.72,1.6,0xb7c3c6,24);for(let y=2.9;y<4.2;y+=.3)flange(g,-2,y,-1.1,.66);
 gauge(g,2.9,3.4,.1);line(g,[[2.9,3.1,.1],[2.9,2.5,.1]],0xa5b8bd,.055);return main;}
function pumpModel(g,e,base){
 if(e.id.startsWith('IRP-')){const main=cylinder(g,0,0,0,1.35,2.2,base,32);main.rotation.x=Math.PI/2;flange(g,0,0,1.1,1.35,'z');const rotor=new THREE.Group();rotor.position.z=1.23;for(let i=0;i<3;i++){const blade=box(rotor,0,.6,0,.42,1.2,.12,0xa3b3b6,{metalness:.6,roughness:.32});blade.rotation.z=i*Math.PI*2/3;blade.position.set(Math.sin(-i*Math.PI*2/3)*.55,Math.cos(i*Math.PI*2/3)*.55,0);}g.add(rotor);rotors.push({group:rotor,id:e.id});line(g,[[-1,-1.6,0],[-1,3.8,0]],0x9dadb1,.12);return main;}
 if(e.parent==='CHEM-01'){box(g,0,-1.4,0,2.2,.25,1.8,0xa4b0b4);const main=box(g,0,-.5,0,1.5,1.6,1.1,base,{metalness:.3,roughness:.4});const head=cylinder(g,0,-.5,.8,.6,.5,0xa3b6b9);head.rotation.x=Math.PI/2;pipeDetail(g,[[0,-.5,1],[0,1.3,1],[1.5,1.3,1]],.12);nameplate(g,e.id,0,.05,.58,1.1);return main;}
 const main=cylinder(g,0,.15,0,1.12,2.5,base,32);cylinder(g,0,1.45,0,.9,.26,0x87999d);cylinder(g,0,-1.5,.3,1.5,.9,base,32);cylinder(g,0,-2.03,.3,1.32,.16,0x677b83);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;const fin=box(g,Math.sin(a)*1.08,.05,Math.cos(a)*1.08,.1,1.8,.22,base,{roughness:.45,metalness:.4});fin.rotation.y=a;}
 for(const x of [-1.1,1.1])box(g,x,-2.13,.2,.32,.2,2.1,0x424c54);
 const loop=new THREE.Mesh(new THREE.TorusGeometry(.48,.105,8,24),material(0xa4adb0,{metalness:.7,roughness:.3}));loop.position.set(0,1.84,0);g.add(loop);
 pipeDetail(g,[[1.1,-1.35,.3],[2.2,-1.35,.3],[2.2,2.6,.3],...(e.id.startsWith('P-IN-')?[[2.2,2.6,-3.5]]:[])],.55);flange(g,2.2,.5,.3,.55);for(const z of [-.8,.8])line(g,[[-1.9,-1.8,z],[-1.9,3.6,z]],0x8d9da3,.09);line(g,[[-.45,1.5,-.3],[-.65,2.4,-.5],[-1.9,3.2,-.8]],0x202c34,.065);nameplate(g,e.id,0,.55,1.14,1.1);return main;}
function addBasinDetails(g,f){
 // Physical air header and downcomers stay visible independently of route overlays.
 pipeDetail(g,[[-8,2.6,-f.d/2-1],[47,2.6,-f.d/2-1]],.36);for(const x of [0,18,36]){pipeDetail(g,[[x,2.6,-f.d/2-1],[x,2.6,-8],[x,-4.4,-8]],.19);flange(g,x,2.6,-9,.19,'z');box(g,x,2.9,-10,.7,.6,.7,0x366f83);}
 for(const z of [-f.d/2,f.d/2])line(g,[[-f.w/2,2.35,z],[f.w/2,2.35,z]],0x9aabb0,.08);
 for(const x of [-f.w/2,f.w/2])for(let z=-f.d/2;z<=f.d/2;z+=4)line(g,[[x,1.8,z],[x,2.9,z]],0xa1aeb2,.07);
 for(let x=-f.w/2+1;x<f.w/2;x+=6){box(g,x,1.88,-f.d/2,5.8,.14,1.2,0xb1b7b4);box(g,x,1.88,f.d/2,5.8,.14,1.2,0xb1b7b4);}
 // Fine bubbles and foam only in the aerobic section. Instanced to limit draw calls.
 const foam=new THREE.InstancedMesh(new THREE.CircleGeometry(.065,6),new THREE.MeshStandardMaterial({color:0xb8a989,roughness:.65,side:THREE.DoubleSide}),1400);const dummy=new THREE.Object3D();let seed=137;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 for(let i=0;i<1400;i++){dummy.position.set(-8+rnd()*56,1.08,-10.9+rnd()*21.8);dummy.rotation.x=-Math.PI/2;const s=.5+rnd()*2;dummy.scale.set(s,s,1);dummy.updateMatrix();foam.setMatrixAt(i,dummy.matrix);}g.add(foam);waterObjects.push(foam);
 for(const x of [-38,-10]){for(const z of [-10,10]){line(g,[[x,2.15,z],[x,3.2,z]],0x98a8ad,.08);}line(g,[[x,3.2,-10],[x,3.2,10]],0x98a8ad,.09);}
}

function material(color,extra={}){const concrete=[colors.wall,colors.concrete,0xc8d2d4,0xe2e6e4].includes(color),metal=[colors.metal,0xa5b2b4,0xa4adb0,0x9baaad].includes(color);return new THREE.MeshStandardMaterial({color,roughness:metal?.34:.78,metalness:metal?.65:.05,...(concrete?{map:surfaceTexture('concrete'),bumpMap:surfaceTexture('concrete'),bumpScale:.07}:{}),...extra});}
function box(g,x,y,z,w,h,d,color,extra){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(color,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function cylinder(g,x,y,z,r,h,color,segments=24){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function line(g,pts,color,width=.4){for(let i=1;i<pts.length;i++){const a=new THREE.Vector3(...pts[i-1]),b=new THREE.Vector3(...pts[i]),delta=b.clone().sub(a);if(delta.length()<.001)continue;const m=new THREE.Mesh(new THREE.CylinderGeometry(width,width,delta.length(),12),material(color));m.position.copy(a.clone().add(b).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());g.add(m);}}
function tank(g,w,d,depth=6,waterColor=colors.water,waterY=1,kind='tank'){const bottom=waterY-depth;
 box(g,0,bottom-.35,0,w,.7,d,colors.wall);
 const walls=[box(g,-w/2,(bottom+1.8)/2,0,.65,1.8-bottom,d,colors.wall),box(g,w/2,(bottom+1.8)/2,0,.65,1.8-bottom,d,colors.wall),box(g,0,(bottom+1.8)/2,-d/2,w,1.8-bottom,.65,colors.wall),box(g,0,(bottom+1.8)/2,d/2,w,1.8-bottom,.65,colors.wall)];
 cutObjects.push(walls[3]);
 if(kind==='bio'){waterSurface(g,-44,0,11.3,d-.8,waterY,kind);waterSurface(g,-24,0,27.3,d-.8,waterY,kind);waterSurface(g,20,0,59.3,d-.8,waterY,kind);}else waterSurface(g,0,0,w-.8,d-.8,waterY,kind);
 line(g,[[-w/2,2.9,-d/2],[w/2,2.9,-d/2],[w/2,2.9,d/2],[-w/2,2.9,d/2],[-w/2,2.9,-d/2]],0x7a999f,.12);
 for(let x=-w/2;x<=w/2;x+=6){line(g,[[x,1.8,-d/2],[x,2.9,-d/2]],0x7a999f,.09);line(g,[[x,1.8,d/2],[x,2.9,d/2]],0x7a999f,.09);}
}
function building(g,f){box(g,0,.25,0,f.w+2,.5,f.d+2,0xc8d2d4);if(f.id==='AIR-01'){pipeDetail(g,[[-19,7,-5],[19,7,-5]],.75);for(let x=-19;x<=19;x+=9.5){line(g,[[x,.5,-5],[x,6.2,-5]],0x6c818c,.13);}}box(g,0,f.h/2,-f.d/2,f.w,f.h,.7,0xe2e6e4);box(g,-f.w/2,f.h/2,0,.7,f.h,f.d,0xe2e6e4);box(g,f.w/2,f.h/2,0,.7,f.h,f.d,0xe2e6e4);const front=box(g,0,f.h/2,f.d/2,f.w,f.h,.7,0xe2e6e4);cutObjects.push(front);const roof=box(g,0,f.h+.3,0,f.w+1,.6,f.d+1,colors.roof);cutObjects.push(roof);
 for(let x=-f.w/2+4;x<f.w/2-2;x+=7){const win=box(g,x,f.h*.63,f.d/2+.41,3.4,2,.12,0x78a8bc,{roughness:.25});cutObjects.push(win);}
 const door=box(g,0,2.5,f.d/2+.5,5,5,.2,0x6c8a98);cutObjects.push(door);
}
function createFacility(f){const g=new THREE.Group();g.position.set(f.x,0,f.z);g.userData.id=f.id;root.add(g);objectGroups.set(f.id,g);
 if(['bio','pre','grit','tank','tertiary','filter','contact'].includes(f.kind)){
  tank(g,f.w,f.d,f.kind==='bio'?6:f.kind==='contact'?3:4,f.kind==='pre'?0x708f80:f.kind==='bio'?0x609c93:colors.water2,1,f.kind);
  if(f.kind==='pre'){pipeDetail(g,[[-9.8,1.9,-4.5],[15,1.9,-4.5],[15,1.9,-14]],.7);}
  if(f.kind==='bio'){addBasinDetails(g,f);
   for(const [x,z] of [[-38,1.5],[-10,-1.5]]){box(g,x,-1.6,z,.65,6.5,f.d-3,colors.wall);box(g,x,1.9,0,2,.3,f.d,colors.concrete);}
   for(const [x,text] of [[-44,'厌氧'],[-24,'缺氧'],[20,'好氧']])textPlate(g,text,x,3.3,0,10);
   const geo=new THREE.CylinderGeometry(.4,.4,.18,8),mat=material(0x354f59),inst=new THREE.InstancedMesh(geo,mat,120),dummy=new THREE.Object3D();let n=0;
   for(let x=-6;x<=46;x+=6)for(let z=-9;z<=9;z+=3){dummy.position.set(x,-4.55,z);dummy.updateMatrix();inst.setMatrixAt(n++,dummy.matrix);}inst.count=n;g.add(inst);
   for(let z=-8;z<=8;z+=8)line(g,[[-8,-4.5,z],[47,-4.5,z]],0x788b8c,.18);
  }else if(f.kind==='grit'){
   for(const x of [-9,9]){const ring=new THREE.Mesh(new THREE.TorusGeometry(6,.55,8,32),material(colors.concrete));ring.rotation.x=Math.PI/2;ring.position.set(x,1.5,8);g.add(ring);}
  }else if(f.kind==='contact'){
   for(let z=-24,j=0;z<=24;z+=12,j++)box(g,j%2?-2:2,-.2,z,f.w-5,3,.55,colors.concrete);
  }else if(f.kind==='tertiary'){box(g,-4,-.5,0,.7,4,f.d,colors.concrete);box(g,-10,-.5,0,15,4,.6,colors.concrete);}
 }else if(['clarifier','sludgetank'].includes(f.kind)){
  const r=f.w/2;cylinder(g,0,-3.5,0,r,.6,colors.concrete,48);
  const ring=new THREE.Mesh(new THREE.CylinderGeometry(r,r,5,64,1,true),material(colors.wall,{side:THREE.DoubleSide}));ring.position.y=-1;g.add(ring);cutObjects.push(ring);
  const water=cylinder(g,0,1,0,r-.5,.12,f.kind==='sludgetank'?0x858f80:colors.water2,64);waterObjects.push(water);
  cylinder(g,0,1,0,2.7,3,colors.concrete);box(g,0,2.1,0,f.w,1,1.4,colors.metal);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(r,.45,8,64),material(colors.concrete));rim.rotation.x=Math.PI/2;rim.position.y=1.8;g.add(rim);
 }else if(f.kind==='odor'){
  box(g,0,2,0,f.w,4,f.d,0xa1b7a4);for(let x=-15;x<=15;x+=10)box(g,x,4.1,0,8,.3,f.d-2,0x8ba581);cylinder(g,16,7,0,1.5,14,0x8da0a1);
 }else building(g,f);
 g.traverse(o=>{if(o.isMesh){o.userData.id=f.id;pickables.push(o);}});
 addSceneLabel(f);
}
function textPlate(g,text,x,y,z,width){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffffed';ctx.fillRect(0,0,256,64);ctx.fillStyle='#244b5b';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='30px sans-serif';ctx.fillText(text,128,32);const texture=new THREE.CanvasTexture(canvas);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true}));sprite.position.set(x,y,z);sprite.scale.set(width,width/4,1);g.add(sprite);}
function createEquipment(e){const g=new THREE.Group();g.position.set(e.x,e.y||2,e.z);g.userData.id=e.id;root.add(g);objectGroups.set(e.id,g);const base=e.status==='备用'?0x8c9ca5:0x3c7895;let main;
 if(e.kind==='pump'){main=pumpModel(g,e,base);}
 else if(e.kind==='blower'){main=blowerModel(g,e,base);} else if(e.kind==='mixer'){main=cylinder(g,0,0,0,.9,2.1,base,12);const hub=new THREE.Group();hub.rotation.z=Math.PI/2;box(hub,0,0,0,.35,4,.5,0x45616c);box(hub,0,0,0,.35,.5,4,0x45616c);hub.position.y=-.7;g.add(hub);}
 else if(e.kind==='sensor'){main=box(g,0,.7,0,1.5,1.3,1,0xd7b74c,{metalness:.35,roughness:.4});box(g,0,.83,.53,1,.55,.06,0x254756);nameplate(g,e.id,0,.32,.54,1);line(g,[[0,0,0],[0,-4.2,0]],0xabbabc,.13);cylinder(g,0,-4.3,0,.24,.8,0x5b6e75);box(g,0,-.4,0,.8,.2,.8,0x8e9fa6);}
 else if(e.kind==='valve'){main=cylinder(g,0,0,0,1,1.7,0x54888a);const wheel=new THREE.Mesh(new THREE.TorusGeometry(1,.18,6,16),material(0x2d586b));wheel.position.y=1.4;wheel.rotation.x=Math.PI/2;g.add(wheel);}
 else if(e.kind==='tank'){main=cylinder(g,0,.8,0,2.5,6,0x91c0bc);const cap=new THREE.Mesh(new THREE.SphereGeometry(2.5,16,8,0,Math.PI*2,0,Math.PI/2),material(0xb4cecc));cap.position.y=3.8;g.add(cap);}
 else if(e.kind==='dewater'){main=box(g,0,0,0,8,3,3.7,0x5b8296);const drum=cylinder(g,0,1,0,1.7,5,0x96aeb8);drum.rotation.z=Math.PI/2;}
 else if(e.kind==='screen'){main=box(g,0,0,0,4,.5,6,0x587685);main.rotation.x=-.35;for(let x=-1.7;x<2;x+=.5)line(g,[[x,-1,-3],[x,1,3]],0xbccace,.1);}
 else if(e.kind==='cabinet'){main=box(g,0,.8,0,5,5,4,0x688699);}
 else if(e.kind==='filter'){main=box(g,0,0,0,7,1,9,colors.metal);for(let z=-3;z<=3;z+=1.5){const disc=cylinder(g,0,1,z,2.4,.4,0x8dacae);disc.rotation.x=Math.PI/2;}}
 else if(e.kind==='diffuser'){main=box(g,0,0,0,12,.25,.3,0x506f73);for(let x=-5;x<=5;x+=2)line(g,[[x,0,-6],[x,0,6]],0x506f73,.12);}
 else {main=box(g,0,.4,0,2.5,1.5,2.5,colors.metal);}
 if(main)equipmentMats.set(e.id,{mat:main.material,base,lamp:main.userData.statusLamp});
 g.traverse(o=>{if(o.isMesh){o.userData.id=e.id;pickables.push(o);}});
 if(['blower','pump','sensor'].includes(e.kind))addSceneLabel(e);
}
function ground(){
 const shape=new THREE.Shape();shape.moveTo(-210,-140);shape.lineTo(210,-140);shape.lineTo(210,140);shape.lineTo(-210,140);shape.closePath();
 for(const f of D.facilities.filter(a=>['bio','pre','grit','tank','tertiary','filter','contact','clarifier','sludgetank'].includes(a.kind))){const hole=new THREE.Path();if(['clarifier','sludgetank'].includes(f.kind))hole.absarc(f.x,-f.z,f.w/2+.5,0,Math.PI*2,true);else {const x=f.x-f.w/2-.5,z=-f.z-f.d/2-.5,w=f.w+1,d=f.d+1;hole.moveTo(x,z);hole.lineTo(x,z+d);hole.lineTo(x+w,z+d);hole.lineTo(x+w,z);hole.closePath();}shape.holes.push(hole);}
 const m=new THREE.Mesh(new THREE.ShapeGeometry(shape),material(colors.ground));m.rotation.x=-Math.PI/2;m.position.y=-.05;m.receiveShadow=true;scene.add(m);box(scene,0,-6.8,0,420,1,280,0x9eadab);
 const road=(x,z,w,d)=>box(scene,x,.03,z,w,.08,d,colors.road);
 road(-200,0,8,263);road(202,0,8,263);road(0,-99,400,8);road(0,95,400,8);road(-111,0,8,184);road(29,0,8,184);road(97,0,7,184);road(150,0,7,184);
 for(const z of [-76,-38,0,38,76])road(-42,z,137,7);
 for(let z=-126;z<=126;z+=18){for(const x of [-206,207]){cylinder(scene,x,1.4,z,.28,2.8,0x899481,6);const tree=new THREE.Mesh(new THREE.SphereGeometry(2.2,7,6),material(0x91ab91));tree.position.set(x,4,z);scene.add(tree);}}
 for(let x=-185;x<=180;x+=22){for(const z of [-133,133]){const tree=new THREE.Mesh(new THREE.SphereGeometry(2,7,6),material(0x91ab91));tree.position.set(x,2.6,z);scene.add(tree);}}
 line(scene,[[-210,1,-140],[210,1,-140],[210,1,140],[-210,1,140],[-210,1,-140]],0x839ca3,.12);
 textPlate(scene,'西 · 进水',-185,8,-96,23);textPlate(scene,'东 · 出水',193,8,70,23);
}
function createPipes(){const palette={water:0x078bc4,ras:0x9468ac,air:0xdfad47,sludge:0x8d735c,chemical:0x568d83};
 for(const layer of Object.keys(palette)){const g=new THREE.Group();g.visible=layer==='water';scene.add(g);pipeGroups[layer]=g;}
 for(const p of D.pipes){const g=pipeGroups[p.layer],pts=p.points;pipeDetail(g,pts,p.layer==='water'?.48:.32,palette[p.layer]);for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],len=Math.hypot(b[0]-a[0],b[2]-a[2]);if(Math.abs(a[1]-b[1])<.01&&a[1]>.5)for(let t=12;t<len;t+=24){const u=t/len,x=a[0]+(b[0]-a[0])*u,z=a[2]+(b[2]-a[2])*u;box(g,x,(a[1]-.35)/2,z,.65,a[1]-.35,.65,0x8d9798);}}const vectors=pts.map(p=>new THREE.Vector3(...p));const curve=new THREE.CurvePath();for(let i=1;i<vectors.length;i++)curve.add(new THREE.LineCurve3(vectors[i-1],vectors[i]));
  const arrow=new THREE.Mesh(new THREE.ConeGeometry(1,2.8,8),material(palette[p.layer]));g.add(arrow);flowMarkers.push({arrow,curve,index:flowMarkers.length});
 }
}
function initScene(){scene=new THREE.Scene();scene.background=new THREE.Color(0xeaf1f4);camera=new THREE.PerspectiveCamera(43,1,.1,2500);renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;$('viewport').append(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xe0f0ff,0x6f7662,1.8));const sun=new THREE.DirectionalLight(0xfff7e8,2.2);sun.position.set(-170,270,100);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-280,right:280,top:230,bottom:-230,near:10,far:700});sun.shadow.bias=-.001;scene.add(sun);
 root=new THREE.Group();scene.add(root);ground();D.facilities.forEach(createFacility);D.equipment.forEach(createEquipment);createPipes();updateAppearance();
 const resize=()=>{const b=$('viewport').getBoundingClientRect();renderer.setSize(b.width,b.height);camera.aspect=b.width/b.height;camera.updateProjectionMatrix();if(autoFit&&(mode==='orbit'||mode==='plan'))fitOverview();};observer=new ResizeObserver(resize);observer.observe($('viewport'));resize();updateCamera();bindCanvas();frame=requestAnimationFrame(animate);
}
function updateAppearance(){if(!scene)return;for(const e of D.equipment){const m=equipmentMats.get(e.id);if(!m)continue;const st=status(e);if(m.lamp)m.lamp.material.color.setHex(st==='故障停机'?0xd94a4a:e.status==='备用'?0x959d9f:0x43b985);m.mat.color.setHex(st==='故障停机'?0xd94a4a:st==='温度预警'?0xf28c28:st==='离线'?0x97a4ac:m.base);}}
function syncRiskMarkers(risks){const groups=new Map();for(const r of risks){if(!groups.has(r.location))groups.set(r.location,[]);groups.get(r.location).push(r);}
 for(const [id,m] of riskMarkers){const visible=groups.has(id);m.light.visible=visible;m.el.hidden=!visible;}
 for(const [id,events] of groups){const f=entities.get(id);let m=riskMarkers.get(id);const alarm=events.some(r=>r.level==='alarm'),color=alarm?0xd94a4a:0xf28c28;
  if(!m){const light=new THREE.Group(),height=(f.kind==='building'?f.h:3)+3;light.position.set(f.x,height,f.z);const bulb=new THREE.Mesh(new THREE.SphereGeometry(2.4,16,12),new THREE.MeshBasicMaterial({color,depthTest:false}));bulb.renderOrder=10;light.add(bulb);const ring=new THREE.Mesh(new THREE.TorusGeometry(4,.3,8,32),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.75,depthTest:false}));ring.rotation.x=Math.PI/2;ring.renderOrder=10;light.add(ring);scene.add(light);const el=document.createElement('div');el.className='risk-marker';$('riskMarkers').append(el);m={el,light,bulb,ring,pos:new THREE.Vector3(f.x,height+5,f.z)};riskMarkers.set(id,m);}
  m.light.visible=true;m.el.hidden=false;m.bulb.material.color.setHex(color);m.ring.material.color.setHex(color);m.el.className='risk-marker '+(alarm?'alarm':'warning');m.el.innerHTML='';
  for(const r of events){const b=document.createElement('button');b.className=r.level;b.dataset.markerRisk=r.id;b.innerHTML=`<span class="risk-dot" aria-hidden="true"></span>${escape(r.title)}<b>${r.level==='alarm'?'告警':'预警'}</b>`;b.onclick=()=>focusRisk(r);m.el.append(b);}
 }
}
function positionRiskMarkers(bounds){const occupied=[];
 for(const el of [$('riskPanel').classList.contains('open')?$('riskPanel'):$('riskReveal'),$('detailDrawer').classList.contains('open')?$('detailDrawer'):$('detailReveal')]){const r=el.getBoundingClientRect();occupied.push({x:r.left-bounds.left,y:r.top-bounds.top,w:r.width,h:r.height});}
 for(const m of riskMarkers.values()){if(!m.light.visible)continue;m.light.scale.setScalar(Math.max(.22,Math.min(1,camera.position.distanceTo(m.light.position)/150)));const v=m.pos.clone().project(camera);const px=(v.x*.5+.5)*bounds.width,py=(-v.y*.5+.5)*bounds.height;let visible=v.z>-1&&v.z<1&&px>0&&px<bounds.width&&py>0&&py<bounds.height;m.el.style.visibility=visible?'visible':'hidden';if(!visible)continue;
  const w=m.el.offsetWidth,h=m.el.offsetHeight,x=Math.max(5,Math.min(bounds.width-w-5,px-w/2));let y=py-h-8;
  for(let tries=0;tries<8;tries++){const hit=occupied.find(r=>x<r.x+r.w+5&&x+w>r.x-5&&y<r.y+r.h+5&&y+h>r.y-5);if(!hit)break;y=hit.y+hit.h+6;}
  visible=y>5&&y+h<bounds.height-85;m.el.style.visibility=visible?'visible':'hidden';if(visible){m.el.style.left=x+'px';m.el.style.top=y+'px';occupied.push({x,y,w,h});}
 }return occupied;
}
function setCut(value){cut=value;waterObjects.forEach(o=>o.visible=!cut);cutObjects.forEach(o=>o.visible=!cut);$('cut').classList.toggle('active',cut);$('cut').setAttribute('aria-pressed',String(cut));}
$('cut').onclick=()=>setCut(!cut);
$('labels').onclick=()=>{showLabels=!showLabels;$('labels').classList.toggle('active',showLabels);$('labels').setAttribute('aria-pressed',String(showLabels));};
host.querySelectorAll('[data-layer]').forEach(i=>i.onchange=()=>{if(pipeGroups[i.dataset.layer])pipeGroups[i.dataset.layer].visible=i.checked;});
function updateCamera(){if(!camera||mode==='walk'||mode==='tour')return;const p=mode==='plan'?1.555:pitch;camera.position.set(target.x+distance*Math.cos(p)*Math.sin(yaw),target.y+distance*Math.sin(p),target.z+distance*Math.cos(p)*Math.cos(yaw));camera.lookAt(target.x,target.y,target.z);}
function fitOverview(){if(!camera)return;distance=mode==='plan'?Math.max(470,600/camera.aspect):Math.max(620,680/camera.aspect);updateCamera();}
function setMode(m){mode=m;transition=null;keys.clear();$('inspection').hidden=m!=='tour';for(const [id,v] of [['overview','orbit'],['plan','plan'],['walk','walk'],['tour','tour']])$(id).classList.toggle('active',m===v);
 $('viewport').focus({preventScroll:true});
}
$('overview').onclick=()=>{setMode('orbit');autoFit=true;target={x:0,y:0,z:0};yaw=.60;pitch=.85;fitOverview();};
$('plan').onclick=()=>{setMode('plan');autoFit=true;target={x:0,y:0,z:0};yaw=0;fitOverview();};
$('resetView').onclick=()=>{
 $('plan').click();setCut(false);setDrawer(true,true);setRiskPanel(true,true);selected=null;tab='asset';showLabels=true;closeProcessMenus();
 if(highlight){scene.remove(highlight);highlight.geometry.dispose();highlight.material.dispose();highlight=null;}
 $('labels').classList.add('active');$('labels').setAttribute('aria-pressed','true');
 host.querySelectorAll('[data-tab]').forEach(b=>{const on=b.dataset.tab==='asset';b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));});
 renderList();renderDetail();$('detailContent').scrollTop=0;
};
$('walk').onclick=()=>{setMode('walk');if(camera){camera.position.set(-111,2.2,87);walkYaw=-.06;walkPitch=0;updateWalkLook();}notify('已进入地面视角；先点击场景，再用方向键移动。');};
function updateWalkLook(){if(!camera)return;camera.lookAt(camera.position.x+Math.sin(walkYaw)*Math.cos(walkPitch)*20,camera.position.y+Math.sin(walkPitch)*20,camera.position.z-Math.cos(walkYaw)*Math.cos(walkPitch)*20);}
function moveTour(i){tourIndex=Math.max(0,Math.min(D.route.length-1,i));const r=D.route[tourIndex];setMode('tour');select(r.object,false);setCut(true);const eye=new THREE.Vector3(...r.eye),look=new THREE.Vector3(...r.look);if(camera){transition={from:camera.position.clone(),to:eye,look,start:performance.now()};}
 $('stopTitle').textContent=`${String(tourIndex+1).padStart(2,'0')} / ${D.route.length} · ${r.name}`;$('progress').textContent=`已记录 ${new Set(records.map(r=>r.object)).size} / ${D.route.length} 站`;$('checks').innerHTML=r.checks.map((s,i)=>`<label><input type="checkbox" data-check="${i}"> ${escape(s)}</label>`).join('');$('inspectionNote').value='';$('saveMessage').textContent='';$('prevStop').disabled=tourIndex===0;$('nextStop').disabled=tourIndex===D.route.length-1;
}
$('tour').onclick=()=>moveTour(0);$('prevStop').onclick=()=>moveTour(tourIndex-1);$('nextStop').onclick=()=>moveTour(tourIndex+1);$('exitTour').onclick=()=>$('overview').click();
$('saveInspection').onclick=()=>{const checks=[...host.querySelectorAll('[data-check]')].map(c=>c.checked);if(checks.some(c=>!c)){notify('请完成本站三项核查后保存。');return;}const r=D.route[tourIndex],record={id:'DEMO-'+Date.now(),object:r.object,station:r.name,checks,note:$('inspectionNote').value.trim(),savedAt:new Date().toLocaleString('zh-CN',{hour12:false}),scenario,simulationTime:currentTime(),source:'用户操作的本地示例记录，非正式巡检'};const updated=[...records,record];try{localStorage.setItem(storageKey,JSON.stringify(updated));records=updated;$('saveMessage').textContent='已保存到当前浏览器，可导出记录。';$('progress').textContent=`已记录 ${new Set(records.map(r=>r.object)).size} / ${D.route.length} 站`;notify('本站巡检记录已本地保存。');}catch{$('saveMessage').textContent='保存失败：浏览器存储不可用，请导出当前记录。';records=updated;notify('本地保存失败，记录暂留内存，请导出。');}};
$('exportInspection').onclick=()=>{const blob=new Blob([JSON.stringify({site:D.meta.id,source:'数字孪生本地示例，非正式巡检',context:options.context,records},null,2)],{type:'application/json'});const a=document.createElement('a'),url=URL.createObjectURL(blob);urls.add(url);a.href=url;a.download='澄川示范水厂-巡检记录.json';a.click();later(()=>{URL.revokeObjectURL(url);urls.delete(url)},1000);};
function bindCanvas(){const canvas=renderer.domElement;on(canvas,'webglcontextlost',e=>{if(disposed)return;e.preventDefault();cancelAnimationFrame(frame);keys.clear();host.dataset.webgl='lost';$('loadError').textContent='三维图形上下文已丢失，请重新进入本页。对象资料仍可查看。';$('loadError').hidden=false;});let down=null,moved=false;const ray=new THREE.Raycaster();
 on(canvas,'pointerdown',e=>{if(e.isPrimary===false)return;down={x:e.clientX,y:e.clientY,button:e.button,startX:e.clientX,startY:e.clientY};moved=false;canvas.setPointerCapture(e.pointerId);$('viewport').focus({preventScroll:true});});
 on(canvas,'pointermove',e=>{if(!down)return;autoFit=false;const dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.hypot(e.clientX-down.startX,e.clientY-down.startY)>4)moved=true;down.x=e.clientX;down.y=e.clientY;
  if(mode==='walk'){walkYaw+=dx*.004;walkPitch=Math.max(-.7,Math.min(.7,walkPitch-dy*.004));updateWalkLook();}
  else if(mode!=='tour'){if(down.button===2||e.shiftKey){const scale=distance*.0015;target.x-=dx*Math.cos(yaw)*scale;target.z+=dx*Math.sin(yaw)*scale;target.x-=dy*Math.sin(yaw)*scale;target.z-=dy*Math.cos(yaw)*scale;}else if(mode!=='plan'){yaw-=dx*.006;pitch=Math.max(.12,Math.min(1.5,pitch+dy*.004));}else{target.x-=dx*distance*.0014;target.z-=dy*distance*.0014;}updateCamera();}
 });
 on(canvas,'pointerup',e=>{if(down&&!moved&&down.button===0){const b=canvas.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1),camera);const hits=ray.intersectObjects(pickables,false).filter(h=>h.object.visible&&h.object.parent?.visible);if(hits[0])select(hits[0].object.userData.id,false);}down=null;});
 on(canvas,'pointercancel',()=>down=null);on(canvas,'contextmenu',e=>e.preventDefault());const handleSceneWheel=e=>{e.preventDefault();autoFit=false;if(mode==='walk'){camera.position.x+=Math.sin(walkYaw)*e.deltaY*.03;camera.position.z-=Math.cos(walkYaw)*e.deltaY*.03;updateWalkLook();}else if(mode!=='tour'){distance=Math.max(35,Math.min(1600,distance*Math.exp(e.deltaY*.001)));updateCamera();}};
 // Projected labels share the scene wheel behavior; floating panels retain their own scrolling.
 for(const surface of [canvas,$('sceneLabels'),$('riskMarkers')])on(surface,'wheel',handleSceneWheel,{passive:false});
 on($('viewport'),'keydown',e=>{if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){keys.add(e.key);e.preventDefault();}if(e.key==='Escape')$('overview').click();});on(window,'keyup',e=>keys.delete(e.key));on(window,'blur',()=>keys.clear());
}
function positionLabels(){const bounds=$('viewport').getBoundingClientRect(),used=positionRiskMarkers(bounds),parent=selected?.parent||selected?.id;
 const priority=l=>l.id===selected?.id?1000:l.equipment&&entities.get(l.id).parent===parent?800:({'BIO-01':90,'OUT-01':85,'PRE-01':80,'AIR-01':75,'BIO-02':70,'BIO-03':65,'BIO-04':60}[l.id]|| (l.signalIds.length?30:0));
 const entries=[...labelEntries].sort((a,b)=>priority(b)-priority(a));
 const c=new THREE.Vector3(target.x,0,target.z).project(camera),n=new THREE.Vector3(target.x,0,target.z-20).project(camera);const angle=Math.atan2((n.x-c.x)*bounds.width,(n.y-c.y)*bounds.height)*180/Math.PI;host.querySelector('.north').innerHTML=`北 N <span style="display:inline-block;transform:rotate(${angle}deg)">↑</span>`;
 for(const l of entries){const a=entities.get(l.id),isSelected=l.id===selected?.id,near=camera.position.distanceTo(l.pos)<125;
  const eligible=showLabels&&(!l.equipment||(cut&&near)||isSelected)&&(!(mode==='walk'||mode==='tour')||near||isSelected);
  l.leader.style.display='none';l.el.style.visibility='hidden';l.el.style.display=eligible?'block':'none';if(!eligible)continue;
  const v=l.pos.clone().project(camera),px=(v.x*.5+.5)*bounds.width,py=(-v.y*.5+.5)*bounds.height;
  if(v.z<=-1||v.z>=1||px<0||px>bounds.width||py<0||py>bounds.height)continue;
  if(!l.width){l.width=l.el.offsetWidth;l.height=l.el.offsetHeight;}
  const w=l.width,h=l.height,offsets=[[-w/2,-h-14],[14,-h/2],[-w-14,-h/2],[-w/2,16],[-w/2-70,-h-48],[-w/2+70,-h-48],[-w/2-70,55],[-w/2+70,55],[-w/2,-h-110],[-w/2,110],[120,-h/2],[-w-120,-h/2],[-w/2,160]];
  let chosen;
  for(const [dx,dy] of offsets){const r={x:px+dx,y:py+dy,w,h};if(r.x<7||r.x+w>bounds.width-7||r.y<32||r.y+h>bounds.height-12)continue;if(used.some(o=>r.x<o.x+o.w+5&&r.x+w>o.x-5&&r.y<o.y+o.h+5&&r.y+h>o.y-5))continue;chosen=r;break;}
  if(!chosen)continue;
  l.el.style.visibility='visible';l.el.style.left=chosen.x+'px';l.el.style.top=chosen.y+'px';l.el.classList.toggle('selected',isSelected);used.push(chosen);
  const ex=Math.max(chosen.x,Math.min(px,chosen.x+w)),ey=Math.max(chosen.y,Math.min(py,chosen.y+h));l.leader.setAttribute('d',`M ${px} ${py} L ${ex} ${ey}`);l.leader.classList.toggle('selected',isSelected);l.leader.style.display='block';
 }
}

function animate(now){if(disposed)return;frame=requestAnimationFrame(animate);const dt=Math.min((now-lastFrame)/1000,.05)||.016;lastFrame=now;
 if(mode==='walk'){const f=(keys.has('w')||keys.has('ArrowUp')?1:0)-(keys.has('s')||keys.has('ArrowDown')?1:0),s=(keys.has('d')||keys.has('ArrowRight')?1:0)-(keys.has('a')||keys.has('ArrowLeft')?1:0);if(f||s){camera.position.x=Math.max(-208,Math.min(208,camera.position.x+(Math.sin(walkYaw)*f+Math.cos(walkYaw)*s)*dt*12));camera.position.z=Math.max(-138,Math.min(138,camera.position.z+(-Math.cos(walkYaw)*f+Math.sin(walkYaw)*s)*dt*12));updateWalkLook();}}
 if(transition){const t=Math.min((now-transition.start)/800,1),e=t*t*(3-2*t);camera.position.lerpVectors(transition.from,transition.to,e);camera.lookAt(transition.look);if(t>=1)transition=null;}
 for(const f of flowMarkers){if(!f.arrow.parent.visible)continue;const u=((now*.000045+f.index*.137)%1);f.arrow.position.copy(f.curve.getPointAt(u));const tangent=f.curve.getTangentAt(u).normalize();f.arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),tangent);}
 for(const w of waterAnimations){w.clock.value=now*.001;w.map.offset.x=now*.000004;w.map.offset.y=now*.000002;}for(const r of rotors){if(status(entities.get(r.id))==='运行')r.group.rotation.z=now*.002;}positionLabels();renderer.render(scene,camera);
}
try{initScene();host.dataset.webgl='ready';}catch(err){releaseGraphics();host.dataset.webgl='unavailable';$('loadError').hidden=false;for(const id of ['overview','plan','walk','tour','cut','labels'])$(id).disabled=true;}
setDrawer(true,true);setRiskPanel(true,true);renderList();renderDetail();renderRiskPanel();
// Read-only diagnostic snapshot, used for focused demo verification.
const snapshot=()=>({selected:selected?.id,tab,scenario,mode,cut,records:records.length,facilities:D.facilities.length,equipment:D.equipment.length,signals:D.signals.length,webgl:!!renderer,camera:camera?.position.toArray(),risks:activeRisks().map(r=>({id:r.id,object:r.object,level:r.level,value:riskValue(r)})),signalValues:D.signals.filter(s=>['DO-01.VALUE','BL-02.RUN','BL-02.FAULT','BL-02.FREQ','AIR-01.FLOW','BL-01.TEMP','PRE-01.H2S'].includes(s.id)).map(s=>({id:s.id,value:signalValue(s)}))});
return {dispose,snapshot};
}
