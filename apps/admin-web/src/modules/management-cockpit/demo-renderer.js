// Fixed accepted-light-v1 demo snapshot only. No API, user data, shell or global events.
export const topics=[['operations','生产运行'],['process','工艺管理'],['equipment','设备管理'],['laboratory','化验管理'],['safety','安全管理'],['inventory','库存管理'],['business','经营管理'],['efficiency','提质增效'],['evaluation','过程评价'],['quality','管理质量'],['improvement','改进提升']];
export function createDemoRenderer() {

const C={blue:'#078bc4',aqua:'#20aaa0',green:'#2f9e6f',orange:'#f28c28',red:'#d94a4a',slate:'#829daa',purple:'#7c82ad',light:'#e8f0f4'};

const state={topic:'operations',waterPeriod:'month',pollutant:'COD',energyMetric:'power',basin:'A',safetyView:'all',businessView:'cost'};
const flow=[78200,79400,80100,81200,78800,82300,81700,80600,79300,82500,83100,81900,80800,82000,81500,82700,80000,82000];
const unitPower=[.319,.316,.31,.308,.314,.306,.309,.305,.312,.303,.3,.307,.311,.304,.302,.298,.308,.3];
const dailyPower=flow.map((v,i)=>Math.round(v*unitPower[i]));
const sum=a=>a.reduce((s,v)=>s+v,0),fmt=(n,d=0)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const monthFlow=sum(flow),monthPower=sum(dailyPower),monthlyUnit=monthPower/monthFlow;
const hourly=[3065,2985,2935,2865,2945,3145,3465,3675,3835,3865,3655,3565,3505,3355,3285,3385,3525,3695,3825,3675,3575,3455,3335,3385];
const pollutants={COD:{unit:'mg/L',values:[285,262,32,21,18.6],target:40},'NH₃-N':{unit:'mg/L',values:[32.5,31.4,.7,.4,.28],target:1.5},TN:{unit:'mg/L',values:[41.2,39.8,10.1,9.5,9.2],target:12},TP:{unit:'mg/L',values:[4.2,3.9,.64,.21,.18],target:.3},SS:{unit:'mg/L',values:[196,135,16,6.5,5.2],target:8}};
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=(id)=>`<svg aria-hidden="true"><use href="/waterx-nav-icons.svg#${id}"/></svg>`;
function kpi(label,value,unit,left,right='',tone='',id='operations'){return `<article class="kpi ${tone ? `kpi-${tone}` : ''}"><div class="kpi-label">${icon(id)}${label}</div><div class="kpi-value">${value}<span class="unit">${unit}</span></div><div class="kpi-detail"><span class="${tone}">${left}</span><span>${right}</span></div></article>`}
function panel(title,body,span=4,action=''){return `<section class="panel span${span}"><header class="panel-head"><h2>${title}</h2>${action}</header>${body}</section>`}
function badge(t,c=''){return `<span class="badge ${c}">${t}</span>`}
function seg(key,options,current){return `<div class="segmented" aria-label="${({waterPeriod:'水量统计周期',safetyView:'隐患筛选',businessView:'经营图表'})[key]||'图表指标'}">${options.map(([v,t])=>`<button data-${key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}="${v}" class="${v===current?'active':''}" aria-pressed="${v===current}">${t}</button>`).join('')}</div>`}
function legend(items){return `<div class="legend">${items.map(([n,c])=>`<span><i style="--c:${c}"></i>${n}</span>`).join('')}</div>`}
function ring(v,label,color=C.green,display=fmt(v,1)+'%',size=''){return `<div class="ring" ${size?`style="width:${size}px"`:''}><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="48" fill="none" stroke="${C.light}" stroke-width="9"/><circle cx="60" cy="60" r="48" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${301.59*v/100} 301.59"/></svg><div class="ring-center">${display}<small>${label}</small></div></div>`}
function stat(l,v,u=''){return `<div class="stat"><label>${l}</label><strong>${v}<span class="unit">${u}</span></strong></div>`}
function progress(l,v,p,c=C.blue){return `<div class="progress-label"><span>${l}</span><b>${v}</b></div><div class="progress"><span style="width:${Math.max(0,Math.min(100,p))}%;background:${c}"></span></div>`}
function table(headers,rows){return `<div class="table-wrap"><table><thead><tr>${headers.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
function bars(rows,max,color=C.blue){return `<div class="hbars">${rows.map(([n,v])=>`<div class="hbar"><span>${n}</span><div class="track"><div class="fill" style="width:${v/max*100}%;background:${color}"></div></div><b>${fmt(v)}</b></div>`).join('')}</div>`}
let chartId=0;
const chartOptions=new Map();

function chart(options){const id='chart'+(++chartId);chartOptions.set(id,options);return drawChart(options,id)}
function drawChart({series,labels,max,height=230,bars=false,target=null,unit='',title='',decimals=0,area=false,width=640},id){
 const w=width,h=height,x0=45,y0=22,right=12,bottom=29,pw=w-x0-right,ph=h-y0-bottom,n=labels.length;const x=i=>x0+(bars?(i+.5)/n:i/Math.max(1,n-1))*pw,y=v=>y0+ph*(1-v/max);
 let s=`<svg class="chart" data-chart="${id}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeHtml(title)}"><title>${escapeHtml(title)}</title><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${series[0].color}" stop-opacity=".2"/><stop offset="1" stop-color="${series[0].color}" stop-opacity=".015"/></linearGradient></defs><text x="0" y="12">${unit}</text>`;
 for(let j=0;j<=4;j++){const v=max*j/4;s+=`<line class="gridline" x1="${x0}" y1="${y(v)}" x2="${w-right}" y2="${y(v)}"/><text x="${x0-8}" y="${y(v)+3}" text-anchor="end">${fmt(v,decimals||Number(!Number.isInteger(v)))}</text>`}
 if(target!==null)s+=`<line x1="${x0}" x2="${w-right}" y1="${y(target)}" y2="${y(target)}" stroke="${C.slate}" stroke-dasharray="6 4"/><text x="${w-right}" y="${y(target)-7}" text-anchor="end">目标 ${fmt(target,decimals)}</text>`;
 series.forEach((sr,si)=>{if(bars){const bw=pw/n*.65/series.length;sr.values.forEach((v,i)=>{if(v==null)return;const tip=escapeHtml(`${labels[i]} · ${sr.name}\n${fmt(v,decimals)} ${unit}`);s+=`<rect data-tip="${tip}" x="${x(i)-bw*series.length/2+si*bw}" y="${y(v)}" width="${bw-1}" height="${y(0)-y(v)}" rx="2" fill="${sr.color}"><title>${tip}</title></rect>`})}else{const pts=sr.values.map((v,i)=>`${x(i)},${y(v)}`).join(' ');if(area&&si===0)s+=`<polygon points="${x(0)},${y(0)} ${pts} ${x(n-1)},${y(0)}" fill="url(#${id})"/>`;s+=`<polyline points="${pts}" fill="none" stroke="${sr.color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;sr.values.forEach((v,i)=>{const tip=escapeHtml(`${labels[i]} · ${sr.name}\n${fmt(v,decimals)} ${unit}`);s+=`<circle data-tip="${tip}" cx="${x(i)}" cy="${y(v)}" r="${n>20?4:3.5}" fill="${sr.color}" stroke="white" stroke-width="1.5"><title>${tip}</title></circle>`})}});
 if(!bars&&series.length===1){const last=series[0].values[n-1];s+=`<text class="endpoint-label" x="${x(n-1)-3}" y="${Math.max(y0+12,y(last)-9)}" text-anchor="end" style="fill:${series[0].color}">${fmt(last,decimals)}</text>`;}
 labels.forEach((l,i)=>{if(n>12&&i%Math.ceil(n/9)!==0&&i!==n-1)return;s+=`<text x="${x(i)}" y="${h-7}" text-anchor="middle">${l}</text>`});return s+'</svg>';
}
function waterChart(){let vals,labels,target,max,unit;if(state.waterPeriod==='day'){vals=hourly;labels=hourly.map((_,i)=>`${i}时`);target=3333;max=5000;unit='m³/h'}else if(state.waterPeriod==='week'){vals=flow.slice(-7).map(v=>v/10000);labels=vals.map((_,i)=>`${i+12}日`);target=8;max=10;unit='万 m³'}else{vals=flow.map(v=>v/10000);labels=flow.map((_,i)=>`${i+1}日`);target=8;max=10;unit='万 m³'}return legend([['处理水量',C.blue],['计划参考',C.slate]])+chart({series:[{name:'处理水量',color:C.blue,values:vals}],labels,max,target,unit,bars:true,title:'处理水量趋势',height:238,decimals:state.waterPeriod==='day'?0:1})+`<div class="chart-caption"><span>${state.waterPeriod==='day'?'09-18 完整日 · 按小时示例':state.waterPeriod==='week'?'09-12 至 09-18':'09-01 至 09-18 · 后续日期不计入'}</span><span>累计 ${fmt(state.waterPeriod==='week'?sum(flow.slice(-7))/10000:state.waterPeriod==='day'?sum(hourly):monthFlow/10000,state.waterPeriod==='day'?0:2)} ${state.waterPeriod==='day'?'m³':'万 m³'}</span></div>`}
function waterRows(){return [['pH','—','7.3','7.1','6–9'],['COD','mg/L','285','18.6','≤ 40'],['NH₃-N','mg/L','32.5','0.28','≤ 1.5'],['TN','mg/L','41.2','9.2','≤ 12'],['TP','mg/L','4.2','0.18','≤ 0.30'],['SS','mg/L','196','5.2','≤ 8']].map(r=>[...r,badge('范围内')])}
function equipment(){return `<div class="kpis">${kpi('设备总数','326','台','关键设备 48 台','已纳入台账','','equipment')}${kpi('设备完好率','99.4','%','完好 324 台','故障 2 台','','quality')}${kpi('本月工单闭环率','75.0','%','已闭环 18 / 24 单','未闭环 6 单','','evaluation')}${kpi('工单按时完成率','94.4','%','按时完成 17 / 18 单','逾期完成 1 单','warning','evaluation')}</div><div class="dashboard-grid">${panel('设备分类与完好率',`${[['A','关键设备',48,100],['B','主要设备',126,99.2],['C','一般设备',152,99.3]].map(([c,n,v,r])=>`<div class="eq-class"><div class="class-symbol">${c}</div><div class="class-name">${n}<b>${v}<span class="unit">台</span></b></div><div class="rate">${fmt(r,1)}%<small>完好率</small></div></div>`).join('')}<p class="mini-note">主要设备、一般设备各有 1 台故障，关键设备完好。</p>`,4)}${panel('设备运行状态',`<div class="ring-layout">${ring(186/326*100,'运行占比',C.blue,'57.1%')}<div class="status-list"><div class="status-row"><span>运行中</span><b>186 <span class="unit">台</span></b></div><div class="status-row"><span>正常备用</span><b>138 <span class="unit">台</span></b></div><div class="status-row"><span>故障停机</span><b class="danger">2 <span class="unit">台</span></b></div></div></div><div class="section-rule"></div><div class="pair">${stat('预防性维护占比','79.2','%')}${stat('巡检完成率','96.8','%')}</div><p class="mini-note">备用为正常状态，不计入故障数量</p>`,4)}${panel('工单办理概况',`<div class="inline-stats">${stat('已闭环','18','单')}${stat('处理中','4','单')}${stat('待处理','2','单')}</div>${progress('本月工单闭环率','75.0%',75)}<div class="section-rule"></div><div class="work-split"><div class="metric-block"><b>3.6 <span class="unit">h</span></b><span>本月平均修复时间</span></div><div class="metric-block"><b>720 <span class="unit">h</span></b><span>近90日平均故障间隔</span></div></div><p class="mini-note">维护工时 86.0 h · 修复工时 18.0 h</p>`,4)}${panel('待闭环故障',table(['设备 / 位号','故障描述','等级','处理状态','负责人'],[['2# 回流泵 / RAS-02','机械密封渗漏',badge('一般故障','amber'),badge('检修中','blue'),'王工'],['3# 排水泵 / DP-03','电机绝缘偏低',badge('一般故障','amber'),badge('待检修','gray'),'赵工']])+'<p class="mini-note">均已启用备用设备；本示例无关键工艺中断。</p>',8)}${panel('备件库存关注',`<div class="insights"><div class="insight">${badge('低库存','amber')}<div><p>回流泵机械密封</p><small>现存 1 套 · 安全库存 2 套</small></div></div><div class="insight">${badge('正常')}<div><p>鼓风机空气滤芯</p><small>现存 8 套 · 安全库存 4 套</small></div></div><div class="insight">${badge('正常')}<div><p>计量泵隔膜</p><small>现存 6 套 · 安全库存 3 套</small></div></div></div>`,4)}</div>`}
const pacRates=[39,38.4,38.6,37.9,38.1,37.4,36.9,37.5,38,37.2,36.8,37.1,36.6,36.9,37.2,36.8,36.7,3000/82000*1000];
const chemicals=[['PAC',3000,36.59],['乙酸钠',1800,21.95],['次氯酸钠',400,4.88],['PAM',90,1.10]];
const renderers={operations:operationsBoard,process:processBoard,equipment,laboratory:laboratoryBoard,safety:safetyBoard,inventory:inventoryBoard,business:businessBoard,efficiency:efficiencyBoard,evaluation:evaluationBoard,quality:managementBoard,improvement:improvementBoard};

/* Module summaries: all values are demonstration data. Source mapping is documented in README. */
function board(kpis,panels){return `<div class="kpis">${kpis.join('')}</div><div class="dashboard-grid">${panels.join('')}</div>`}
function trend(title,values,labels,max,unit,color=C.blue,second=null){return (second?legend([[title,color],[second.name,second.color]]):'')+chart({series:[{name:title,values,color},...(second?[second]:[])],labels,max,unit,area:!second,title,height:205,decimals:max<=1?2:0})}
const seven=['12日','13日','14日','15日','16日','17日','18日'];
function donut(parts,value,label){let offset=0;const total=sum(parts.map(p=>p[1])),circ=301.59;return `<div class="ring-layout composition"><div class="ring"><svg viewBox="0 0 120 120" aria-label="${escapeHtml(label)}">${parts.map(([name,n,color])=>{const len=n/total*circ;const out=`<circle data-tip="${name}：${n}" cx="60" cy="60" r="48" fill="none" stroke="${color}" stroke-width="10" stroke-dasharray="${Math.max(0,len-3)} ${circ}" stroke-dashoffset="${-offset}"/>`;offset+=len;return out}).join('')}</svg><div class="ring-center">${value}<small>${label}</small></div></div><div class="donut-legend">${parts.map(([n,v,c])=>`<div><span><i style="background:${c}"></i>${n}</span><b>${v}</b></div>`).join('')}</div></div>`}
function funnel(items){return `<div class="stage-flow">${items.map(([n,v,c])=>`<div><span class="stage-dot" style="background:${c||C.blue}"></span><b>${v}</b><span>${n}</span></div>`).join('')}</div>`}
function notes(items){return `<div class="insights">${items.map(([status,title,sub,color])=>`<div class="insight">${badge(status,color||'blue')}<div><p>${title}</p><small>${sub}</small></div></div>`).join('')}</div>`}
function compareBars(rows,max,unit=''){return `<div class="compare-bars">${rows.map(([n,v,ref,color])=>`<div class="compare-row"><div class="compare-label"><span>${n}</span><b>${fmt(v,v%1?1:0)}<small> ${unit}${ref!==null?' / '+ref:''}</small></b></div><div class="compare-track"><span style="width:${v/max*100}%;background:${color||C.blue}"></span>${ref!==null?`<i style="left:${ref/max*100}%"></i>`:''}</div></div>`).join('')}</div>`}
function radar(labels,vals){const cx=160,cy=105,r=72,point=(i,v)=>[cx+Math.sin(i*Math.PI/2)*r*v/100,cy-Math.cos(i*Math.PI/2)*r*v/100];return `<svg class="radar" viewBox="0 0 320 210" role="img" aria-label="四维得分率对比">${[25,50,75,100].map(v=>`<polygon points="${labels.map((_,i)=>point(i,v).join(',')).join(' ')}" fill="none" stroke="var(--grid-stroke)"/>`).join('')}${labels.map((l,i)=>{const [x,y]=point(i,100);return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--grid-stroke)"/>`}).join('')}<polygon points="${vals.map((v,i)=>point(i,v).join(',')).join(' ')}" fill="${C.blue}" fill-opacity=".16" stroke="${C.blue}" stroke-width="2"/>${labels.map((l,i)=>{const [x,y]=point(i,125),[px,py]=point(i,vals[i]);return `<text x="${x}" y="${y+4}" text-anchor="${i===1?'start':i===3?'end':'middle'}">${l}</text><circle cx="${px}" cy="${py}" r="3" fill="${C.aqua}" data-tip="${l}得分率 ${fmt(vals[i],1)}%"/>`}).join('')}</svg>`}
function heatmap(){const rows=['运行管理','设备管理','化验管理','安全管理','综合管理'];const values=[[0,0,1,0,0,0,0],[0,1,1,0,1,0,0],[0,0,0,0,0,0,0],[1,0,1,0,0,1,0],[0,0,0,1,0,0,0]];return `<div class="heatmap"><div></div>${seven.map(x=>`<small>${x}</small>`).join('')}${rows.map((r,i)=>`<span>${r}</span>${values[i].map((v,j)=>`<i class="${v?'has-issue':''}" style="background:${v?'var(--heat-warning)':'var(--heat-normal)'}" data-tip="${r} · ${seven[j]}：${v?'有待跟踪事项':'无新增待跟踪事项'}">${v?'!':'·'}</i>`).join('')}`).join('')}</div><div class="chart-caption"><span>绿：无新增待跟踪事项</span><span>橙：有待跟踪事项</span></div>`}
function operationsBoard(){return board([
 kpi('昨日处理水量','8.20','万 m³','负荷 82.0%','完整日统计','','operations'),kpi('当班到岗率','100','%','应到 8 / 实到 8','日班 08:00–20:00','positive','operations'),kpi('当班任务完成率','75.0','%','完成 18 / 24 项','进行中 4 · 待办 2','','evaluation'),kpi('当前运行提醒','3','项','设备 2 · 能耗 1','水质超限 0','warning','evaluation')],[
 panel('处理水量与计划',waterChart(),8,seg('waterPeriod',[['day','昨日'],['week','近7日'],['month','本月']],state.waterPeriod)),
 panel('当班执行进度',donut([['已完成',18,C.aqua],['进行中',4,C.blue],['待办理',2,C.orange]],'24','当班任务')+funnel([['交班待确认',0,C.green],['当班日志',6,C.blue],['异常交接',2,C.orange]]),4,'<span class="panel-note">班组链路示范</span>'),
 panel('交接班与岗位覆盖',table(['岗位','在岗','交接状态'],[['中控运行','2 / 2',badge('已确认')],['现场巡检','3 / 3',badge('已确认')],['设备保障','2 / 2',badge('已确认')],['班组协调','1 / 1',badge('已确认')]])+`<div class="panel-foot">日班 · A 班组 · 接班确认 07:55</div>`,4),
 panel('关键运行事件',notes([['已处置','备用回流泵投入运行','08:15 · 原泵机械密封渗漏','blue'],['待检修','3# 排水泵绝缘偏低','08:40 · 备用已投运','amber'],['待复核','B 池曝气单耗偏高','09:10 · 已交工艺班跟踪','amber']]),4),
 panel('今日任务分布',compareBars([['现场巡检',10,12,C.aqua],['设备检查',4,6,C.blue],['运行记录',3,4,C.blue],['异常跟踪',1,2,C.orange]],12,'项')+`<div class="panel-foot">实色为完成数，细线为计划数</div>`,4)
])}
function processBoard(){const p=pollutants[state.pollutant];return board([
 kpi('当前执行工况','夏季常规','','适用工艺线 A / B / C','V3 · 生效中','','process'),kpi('日数据确认率','94.4','%','已确认 17 / 18 日','1 日待确认','','evaluation'),kpi('诊断结果','6','项关注','预警 4 · 告警 2','另有未判定 5','warning','process'),kpi('已形成分析日报','17','份','对应 17 日已确认数据','版本可追溯','','evaluation')],[
 panel('沿程水质与处理表现',`<div class="chip-row">${Object.keys(pollutants).map(k=>`<button class="chip ${k===state.pollutant?'active':''}" data-pollutant="${k}" aria-pressed="${k===state.pollutant}">${k}</button>`).join('')}</div>`+chart({series:[{name:state.pollutant,color:C.aqua,values:p.values}],labels:['进水','预处理','生化','沉淀','出水'],max:Math.ceil(p.values[0]/10)*10,unit:'mg/L',title:'沿程水质',area:true,decimals:1})+`<div class="chart-caption"><span>沿程采样示例 · 09-18</span><span>去除率 ${fmt((1-p.values[4]/p.values[0])*100,1)}%</span></div>`,8),
 panel('工艺诊断状态',donut([['正常',41,C.aqua],['预警',4,C.orange],['告警',2,C.red],['未判定',5,C.slate],['仅参考',8,C.blue]],'60','诊断指标')+`<div class="panel-foot">缺失或异常数据保留为未判定，不视为正常。</div>`,4),
 panel('工艺链路完整性',funnel([['设计版本',3],['在用工况',1],['已确认日数据',17],['分析日报',17]])+table(['来源','当前引用','状态'],[['设计标准','V2 · 09-01',badge('已发布')],['工况矩阵','V3 · 夏季常规',badge('生效中')],['运行日报','09-18 · V1',badge('已锁定')]]),4),
 panel('关键工艺参数',table(['参数','单位','实际','目标 / 状态'],[['污泥龄','d','14.2','12–18'],['MLSS','mg/L','3,400','3,000–4,000'],['B 池 DO','mg/L','2.8','1.5–3.0'],['回流比','%','195','150–250'],['SVI','mL/g','112','80–130']]),4,'<span class="panel-note">内部示例目标</span>'),
 panel('待核验诊断',notes([['告警','A 线排泥计量偏差','核对计量口径与同周期记录','red'],['预警','B 池曝气单位电耗偏高','结合 DO 与空气分配复核','amber'],['未判定','碱度数据缺失','补齐检测结果后重新诊断','gray']]),4)
])}
function laboratoryBoard(){return board([
 kpi('本月原始记录','108','份','覆盖 18 类记录模板','截至 09-18','','laboratory'),kpi('复核完成率','88.9','%','已复核 96 / 108','待复核 8 · 草稿 4','','evaluation'),kpi('质控合格率','98.3','%','59 / 60 组','1 组待复测','warning','quality'),kpi('已归档化验日报','17','份','应出 18 / 已出 17','1 份待归档','','evaluation')],[
 panel('原始记录与复核趋势',legend([['形成记录',C.blue],['完成复核',C.aqua]])+chart({series:[{name:'形成记录',values:[7,6,8,5,6,7,6],color:C.blue},{name:'完成复核',values:[6,6,7,5,5,6,6],color:C.aqua}],labels:seven,max:10,bars:true,unit:'份',title:'原始记录与复核趋势'})+`<div class="chart-caption"><span>近七日</span><span>原始记录与报表分别统计</span></div>`,8),
 panel('记录生命周期',donut([['已锁定归档',90,C.aqua],['复核通过',6,C.blue],['待复核',8,C.orange],['草稿',4,C.slate]],'108','本月记录')+`<div class="panel-foot">检测与复核分离；更正形成新版本。</div>`,4),
 panel('质控结果',compareBars([['空白样',20,20,C.aqua],['平行样',19,20,C.orange],['标准样',20,20,C.aqua]],20,'组')+`<div class="panel-foot">平行样 1 组待复测，暂不标记通过</div>`,4),
 panel('出水检测摘要',table(['指标','单位','结果','状态'],waterRows().slice(1).map(r=>[r[0],r[1],r[3],badge('目标内')])) ,4,'<span class="panel-note">09-18 已复核结果示例</span>'),
 panel('复核与报表关注',notes([['待复核','氨氮原始记录','4 份 · 待独立复核','amber'],['待复测','SS 平行样偏差','1 组 · 已标注质控异常','amber'],['待归档','09-18 化验日报','相关记录复核后锁定归档','blue']]),4)
])}
function safetyBoard(){const rows=[['脱水间防护罩缺失','一般','整改中','09-20'],['药剂区围堰积液','一般','待复查','09-19'],['配电间警示标识脱落','一般','待受理','09-19'],['应急照明失效','一般','整改中','09-17']];const selected=state.safetyView==='overdue'?rows.slice(-1):rows;return board([
 kpi('本月检查完成率','90.0','%','已完成 36 / 40 项','4 项待执行','','safety'),kpi('隐患闭环率','75.0','%','已关闭 12 / 16 项','待闭环 4 项','','evaluation'),kpi('逾期未闭环','1','项','应急照明整改','超期 2 天','warning','safety'),kpi('当前作业票','3','张','已批准 2 · 审批中 1','演示作业状态','','evaluation')],[
 panel('检查执行与隐患发现',legend([['完成检查',C.blue],['发现隐患',C.orange]])+chart({series:[{name:'完成检查',values:[4,5,4,6,5,6,6],color:C.blue},{name:'发现隐患',values:[1,2,1,3,2,4,3],color:C.orange}],labels:seven,max:8,bars:true,unit:'项',title:'检查与隐患趋势'})+`<div class="chart-caption"><span>近七日</span><span>检查数量与隐患数量为不同统计对象</span></div>`,8),
 panel('隐患治理状态',donut([['已关闭',12,C.aqua],['整改中',2,C.blue],['待复查',1,C.orange],['待受理',1,C.slate]],'16','本月隐患')+`<div class="panel-foot">重大隐患需专业认定，不由数量或颜色推定。</div>`,4),
 panel('重点区域检查覆盖',compareBars([['加药区域',8,8,C.aqua],['污泥脱水',7,8,C.orange],['生化池区',8,8,C.aqua],['配电区域',7,8,C.orange],['厂区公共区',6,8,C.blue]],8,'次'),4),
 panel('待闭环隐患',table(['问题','状态','期限'],selected.map(r=>[r[0],badge(r[2],r[3]==='09-17'?'red':'amber'),r[3]])),4,seg('safetyView',[['all','全部'],['overdue','逾期']],state.safetyView)),
 panel('作业与责任落实',table(['作业类型','票证状态','监护落实'],[['有限空间',badge('已批准','blue'),'已指定'],['临时用电',badge('已批准','blue'),'已指定'],['动火作业',badge('审批中','amber'),'待确认']])+funnel([['培训完成',24,C.aqua],['本月应培训',26,C.blue],['待补训',2,C.orange]]),4)
])}
function inventoryBoard(){return board([
 kpi('库存账面金额','48.6','万元','物资 186 种','示例期末库存','','inventory'),kpi('本月出库金额','18.2','万元','较上月同期 -4.7%','领用不等于投加','','business'),kpi('库存关注','6','项','低库存 2 · 临期 1 · 呆滞 3','待处理','warning','inventory'),kpi('盘点一致率','98.9','%','一致 184 / 186 种','差异 2 种待复核','','quality')],[
 panel('库存收发趋势',legend([['入库金额',C.blue],['出库金额',C.aqua]])+chart({series:[{name:'入库',values:[3.2,2.4,4.1,2.9,3.8,3.1,3.9],color:C.blue},{name:'出库',values:[2.3,2.5,2.7,2.1,3.2,2.6,2.8],color:C.aqua}],labels:seven,max:5,unit:'万元',decimals:1,bars:true,title:'近七日出入库金额'})+`<div class="chart-caption"><span>期初 43.4 + 入库 23.4 − 出库 18.2 = 期末 48.6</span></div>`,8,'<span class="panel-note">规划模块 · 示例</span>'),
 panel('库存金额构成',donut([['药剂',18.6,C.blue],['备品备件',21.4,C.aqua],['耗材',5.2,C.slate],['应急物资',3.4,C.purple]],'48.6','万元'),4),
 panel('药剂保障天数',compareBars([['PAC',8,null,C.aqua],['乙酸钠',7,null,C.aqua],['次氯酸钠',8,null,C.aqua],['PAM',10,null,C.aqua]],12,'天')+`<div class="panel-foot">内部示例补货提醒线：5 天</div>`,4),
 panel('库存风险清单',table(['物资','当前','提醒'],[['泵机械密封','1 套',badge('低库存','amber')],['防护手套','12 副',badge('低库存','amber')],['标准溶液','6 瓶',badge('30天内到期','amber')],['旧型轴承','3 种',badge('呆滞','gray')]]),4),
 panel('物资去向与盘点',compareBars([['生产药剂',10.8,null,C.blue],['设备维护',4.2,null,C.aqua],['日常耗材',2.1,null,C.slate],['安全应急',1.1,null,C.purple]],12,'万元')+`<div class="panel-foot">本月出库合计 18.2 万元 · 盘点差异待审批调整</div>`,4)
])}
function businessBoard(){const isCost=state.businessView==='cost';return board([
 kpi('本月已确认收入','175.0','万元','示例结算单价 1.20 元/m³','统计至 09-18','','business'),kpi('本月归集成本','112.4','万元','吨水 0.771 元/m³','同口径归集','','business'),kpi('预算执行率','57.6','%','已发生 112.4 / 预算 195.0','时间进度 60.0%','','evaluation'),kpi('本月回款率','86.7','%','到账 130.0 / 到期 150.0','未回 20.0','warning','business')],[
 panel(isCost?'单位处理成本趋势':'收入与成本趋势',isCost?trend('吨水成本',[.82,.8,.79,.78,.8,.775,.771],seven,1,'元/m³'):legend([['已确认收入',C.blue],['归集成本',C.aqua]])+chart({series:[{name:'收入',values:[9.8,9.7,9.8,9.8,9.9,9.6,9.8],color:C.blue},{name:'成本',values:[6.7,6.5,6.5,6.4,6.6,6.2,6.3],color:C.aqua}],labels:seven,max:12,bars:true,unit:'万元',title:'收入成本趋势'}),8,seg('businessView',[['cost','单位成本'],['amount','收支金额']],state.businessView)),
 panel('成本构成',donut([['电费',35.84,C.blue],['药剂',12.6,C.aqua],['污泥处置',18.4,C.purple],['人工',27.2,C.slate],['其他',18.36,C.orange]],'112.4','万元')+`<div class="panel-foot">经营口径示范，不等同于财务报表利润。</div>`,4),
 panel('预算执行',compareBars([['电费',35.84,62,C.blue],['药剂',12.6,22,C.aqua],['污泥处置',18.4,31,C.purple],['人工',27.2,45,C.slate],['其他',18.36,35,C.orange]],65,'万元'),4),
 panel('应收回款账龄',compareBars([['未逾期',12,null,C.blue],['逾期 1–30天',5,null,C.orange],['逾期 31–60天',3,null,C.red],['逾期 60天以上',0,null,C.slate]],15,'万元')+`<div class="panel-foot">当月到期未收 20.0 万元，按当前账龄分类</div>`,4),
 panel('经营偏差关注',notes([['跟踪中','8.0 万元应收已逾期','核对结算与付款节点','amber'],['待核对','药剂领用与投加口径','财务归集不可直接用出库替代消耗','blue'],['范围内','预算进度低于时间进度','57.6% / 60.0% · 仍需结合业务节奏','green']]),4)
])}
function efficiencyBoard(){return board([
 kpi('昨日吨水电耗','0.300','kWh/m³','目标 0.320','同日处理 8.20 万 m³','','efficiency'),kpi('本轮分析覆盖','7 / 8','单体','MBBR 本厂不适用','6 类全厂专题','','process'),kpi('示例优化措施','9','项','核验 3 · 实施 2 · 观察 4','汇总设计示范','','improvement'),kpi('观察期电耗变化','−6.3','%','0.320 → 0.300','待同工况复核','positive','efficiency')],[
 panel('电耗与内部目标',legend([['吨水电耗',C.blue],['内部目标',C.slate]])+chart({series:[{name:'电耗',values:unitPower,color:C.blue}],labels:flow.map((_,i)=>`${i+1}日`),max:.4,target:.32,decimals:2,unit:'kWh/m³',area:true,title:'吨水电耗趋势'})+`<div class="chart-caption"><span>观察期变化，不直接认定为措施收益</span><span>09-01 至 09-18</span></div>`,8),
 panel('优化事项推进',donut([['原因核验',3,C.orange],['措施实施',2,C.blue],['效果观察',4,C.aqua]],'9','示例事项')+`<div class="panel-foot">统一任务、收益台账为设计示范，尚未联通。</div>`,4),
 panel('单体分析覆盖',`<div class="unit-matrix">${[['预处理','已分析'],['高效沉淀','已分析'],['V 型滤池','已分析'],['消毒系统','已分析'],['排泥系统','已分析'],['污泥脱水','补充数据'],['曝气供气','待核验'],['MBBR','不适用']].map(([n,s])=>`<div><span>${n}</span>${badge(s,s==='不适用'?'gray':s==='已分析'?'blue':'amber')}</div>`).join('')}</div>`,4),
 panel('全厂分析摘要',table(['专题','示例结果','状态'],[['水量平衡','未解释差额 1.1%',badge('待核对','amber')],['污泥平衡','干固体 11.8 t/d',badge('已核算','blue')],['能效系统','0.300 kWh/m³',badge('已核算','blue')],['药剂与成本','0.085 元/m³',badge('已核算','blue')],['能力与瓶颈','负荷 82%',badge('参考','gray')],['水力高程','水位数据待补',badge('未判定','gray')]]),4),
 panel('措施效果核验',notes([['观察中','B 池曝气分配优化','出水与 DO 保护指标同时跟踪','blue'],['待核验','高效沉淀投药点调整','需核对同水量与进水负荷','amber'],['边界说明','预估、实测与年度外推分列','当前只展示示例观察期数据','gray']]),4)
])}
function evaluationBoard(){return board([
 kpi('本轮检查进度','87.8','%','已检查 115 / 131 项','16 项待检查','','evaluation'),kpi('检查结论符合率','85.8','%','符合 97 / 可判定 113','证据不足 2 项','','quality'),kpi('关联问题','18','项','去重后的主责问题','不同模块可关联','','evaluation'),kpi('已复核关闭','12','项','关闭率 66.7%','待闭环 6 项','','improvement')],[
 panel('五模块检查进度',compareBars([['运行管理',23,25,C.blue],['设备管理',21,25,C.aqua],['化验管理',27,29,C.purple],['安全管理',23,27,C.orange],['综合管理',21,25,C.slate]],30,'项'),8,'<span class="panel-note">检查事实，不混入经营结果评分</span>'),
 panel('检查结论分布',donut([['符合',97,C.aqua],['部分符合',10,C.orange],['不符合',6,C.red],['证据不足',2,C.slate],['待检查',16,C.blue]],'131','检查项'),4),
 panel('近七日事项分布',heatmap(),4),
 panel('问题与整改',table(['来源','主责问题','已关闭'],[['运行管理','4','3'],['设备管理','5','3'],['化验管理','2','2'],['安全管理','4','2'],['综合管理','3','2']])+`<div class="panel-foot">同一事实只计一次主责问题</div>`,4),
 panel('任务与报告状态',funnel([['检查中',1,C.blue],['待整改',2,C.orange],['已锁定',3,C.aqua]])+notes([['待补证','设备保养记录核查','2 项事实证据不足','amber'],['待发布','9 月综合检查报告','完成复核后锁定结果','blue']]),4)
])}
const qualityDims=[['合法合规',19.2,20],['稳定达标',28.5,30],['安全运行',18,20],['经济高效',24.3,30]];
function managementBoard(){return board([
 kpi('管理质量得分','90.0','/ 100','四维加权合计','讨论稿 V0.1','','quality'),kpi('评价指标','18','项','3 + 4 + 3 + 8','全部有示例数据','','evaluation'),kpi('待关注指标','4','项','按本期示例评价识别','待业务复核','warning','quality'),kpi('关联改进建议','3','项','指标来源可追溯','不是自动执行','','improvement')],[
 panel('四维评价画像',radar(qualityDims.map(r=>r[0]),qualityDims.map(r=>r[1]/r[2]*100))+`<div class="chart-caption"><span>图形统一为各维度得分率</span><span>分值权重 20 / 30 / 20 / 30</span></div>`,4),
 panel('四维得分与差距',compareBars(qualityDims.map(([n,v,m])=>[n,v,m,v/m<.85?C.orange:C.aqua]),30,'分')+`<div class="panel-foot">19.2 + 28.5 + 18.0 + 24.3 = 90.0</div>`,4),
 panel('近六期评价趋势',trend('综合得分',[85.4,86.8,87.1,88.6,89.2,90],['4月','5月','6月','7月','8月','9月'],100,'分')+`<div class="chart-caption"><span>同一规则版本的示例序列</span></div>`,4),
 panel('关键结果与依据',table(['评价维度','重点结果','依据'],[['合法合规','义务履约 100%','履约台账'],['稳定达标','日均综合达标 100%','有效天数 18/18'],['安全运行','本期事故 0 起','事件与隐患台账'],['经济高效','吨水电耗 0.300','同日水量、电量']]),8,'<span class="panel-note">所有数值为展示样例，非正式评分</span>'),
 panel('低分指标与改进',notes([['关注','资源效率与可比基线','经济高效得分率 81.0%','amber'],['关注','整改复核证据完整性','安全运行得分率 90.0%','amber'],['规则说明','数据缺失不能按满分处理','不设星级，不并入过程评价分数','gray']]),4)
])}
function improvementBoard(){return board([
 kpi('本期主责问题','24','项','来源已去重','跨模块汇总示范','','improvement'),kpi('复核关闭率','66.7','%','已关闭 16 / 24','待闭环 8 项','','evaluation'),kpi('平均关闭周期','6.2','天','仅按已关闭 16 项计算','不含未结项','','evaluation'),kpi('逾期 / 复发','2 / 1','项','逾期 2 · 复发 1','待升级跟踪','warning','improvement')],[
 panel('问题新增与复核关闭',legend([['新增',C.blue],['复核关闭',C.aqua]])+chart({series:[{name:'新增',values:[3,4,3,5,2,4,3],color:C.blue},{name:'复核关闭',values:[1,2,2,3,2,3,3],color:C.aqua}],labels:seven,max:6,bars:true,unit:'项',title:'问题与关闭趋势'})+`<div class="chart-caption"><span>本期新增 24 · 复核关闭 16</span><span>关闭须确认整改效果</span></div>`,8,'<span class="panel-note">规划模块 · 示例</span>'),
 panel('闭环状态',donut([['已关闭',16,C.aqua],['整改中',4,C.blue],['待复核',2,C.orange],['待派发',2,C.slate]],'24','主责问题'),4),
 panel('问题来源',compareBars([['过程评价',18,null,C.blue],['管理质量',3,null,C.purple],['日常运营',3,null,C.aqua]],20,'项')+`<div class="panel-foot">过程评价关闭 12 + 其他来源关闭 4 = 16</div>`,4),
 panel('重点改进计划',table(['改进事项','阶段','节点'],[['曝气分配优化','效果观察','09-22'],['保养记录完整性','整改执行','09-20'],['出入库口径统一','措施制定','09-25'],['复发问题原因复核','待复核','09-19']]),4),
 panel('效果与经验沉淀',funnel([['形成措施',22,C.blue],['效果复核',18,C.orange],['已关闭',16,C.aqua]])+notes([['已沉淀','巡检检查点补充','更新模板后用于下一轮检查','blue'],['复发关注','同类密封渗漏再次发生','重新核验原因，不直接复用旧结论','amber']]),4)
])}

return {
 render(topic, filters = {}) {
   if (!renderers[topic]) throw new Error('未知驾驶舱专题');
   const allowed={waterPeriod:['day','week','month'],pollutant:Object.keys(pollutants),safetyView:['all','overdue'],businessView:['cost','amount']};
   for(const [key,value] of Object.entries(filters)){ if(allowed[key]?.includes(value))state[key]=value; }
   chartOptions.clear();chartId=0;state.topic=topic;return renderers[topic]();
 },
resize(id,width,height){const options=chartOptions.get(id);return options?drawChart({...options,width,height},id):null;}
};
}
