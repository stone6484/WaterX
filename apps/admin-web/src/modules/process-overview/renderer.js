import {waterxWaterDemo,waterxProcessDemo} from './demo-data.js'

// Fixed confirmed data only. Each mounted page owns its selection state.
export function createOverviewRenderer(){
let fullscreen=false;
/* Local-only process overview. Source ranges are recorded in process-overview-notes.md. */
const overviewState={pollutants:['COD','NH₃-N','TN','TP','SS'],scale:'log',focus:'all',scenario:'current'};
const ovColors={water:'#078bc4',internal:'#188f9c',sludge:'#9c7954',air:'#6c8dab',dose:'#8876ad',ok:'#2f9e6f',high:'#c74c4c',low:'#0877a7',watch:'#c77b25'};
const ovQuality=Object.fromEntries(Object.entries(waterxWaterDemo).map(([name,q])=>[name,{limit:q.target,values:[q.values[0],...({COD:[205,96],'NH₃-N':[31.4,18],TN:[39.8,13.8],TP:[7.8,5.1],SS:[null,null]}[name]),name==='SS'?null:q.values[2],q.values[3],q.values[4]]}]));
const ovSeriesColors={COD:'#078bc4','NH₃-N':'#a467b1',TN:'#299985',TP:'#d48a24',SS:'#758697'};
function ovSeries(name){const q=ovQuality[name];return {...q,values:overviewState.scenario==='stress'&&name==='TN'?[41.2,39.8,22,20,19,18.5]:overviewState.scenario==='stress'&&name==='NH₃-N'?[32.5,31.4,22,3.2,2.8,2.5]:q.values};}
const ovFocus={
 all:['全流程关系','来水提供处理负荷；活性污泥承担转化；曝气、回流、排泥与加药共同影响沿程水质。','当前关注：缺氧 ORP 高于 PPT 参考线；SV₃₀ 高于 PPT 参考区间，结合 SVI 联合观察。'],
 inlet:['进水与上游点源','进水 8.20 万 m³/d，BOD₅/COD 0.63，COD/TN 6.9。先看负荷、可生化性及来水异常。','PPT：排查上游点源，谨防“病从口入”。抑制性物质未检测，不判定为正常。'],
 distribution:['① 水量分配 · 调整“食量”','Q = 3,417 m³/h；厌氧分配 70%，缺氧分配 30%。配水会改变各段底物供给。','HRT 采用单段池容 / 原水 Q 的名义口径，不把含回流的混合流量重复计算为进水。'],
 anaerobic:['厌氧区 · 释磷与氨化','DO 接近 0、ORP 偏低，为厌氧释磷创造环境。沿程 TP 上升可来自释磷，并非自动判为异常。','PPT 第8页：HRT 1–2 h；DO 0 mg/L；ORP < −300 mV；pH 6–8。'],
 anoxic:['缺氧区 · 反硝化','内回流带来硝态氮，进水与碳源提供电子供体；同时关注 DO、ORP 与碳氮关系。','当前 ORP −135 mV，高于第8页 < −150 mV 参考线；提示核查，不直接推断原因或发出控制指令。'],
 aerobic:['好氧区 · 硝化与吸磷','末端 DO 0.48 mg/L；曝气量 12,600 Nm³/h。曝气影响供氧，也会随内回流携氧进入缺氧区。','PPT 第8页末端 DO 0.5 mg/L；演示容差 ±0.1。第7页另述 1–2 mg/L，不能直接当作同一控制标准。'],
 clarifier:['二沉池 · 泥水分离','出水送往后续处理；底部污泥分为外回流与剩余污泥。泥位和沉降性共同影响分离。','示例：泥位 1.2 m、二沉出水 SS 6.5 mg/L；二沉池泥位参考 0.5–1.5 m 为设计补充。'],
 aeration:['② 曝气 · 调整“呼吸”','好氧区供气 12,600 Nm³/h，末端 DO 0.48 mg/L；同时观察 NH₃-N 与回流携氧。','曝气量是调控手段，DO 是过程响应；本页仅展示关系，不执行设备启停或设定写入。'],
 internal:['③ 内回流 r · 硝态氮循环','好氧末端 → 缺氧区；r = Q内 / Q进 = 195%，内回流量 6,663 m³/h。','PPT 第8页参考 100–400%；回流与碳源、DO 需联合分析，不表示越大越好。'],
 external:['④ 外回流 R · 保持污泥循环','二沉池底泥 → 厌氧区；R = Q外 / Q进 = 75%，外回流量 2,563 m³/h。','PPT 第8页参考 50–100%；同时关注二沉池泥位、MLSS 与回流污泥浓度。'],
 waste:['⑤ 排泥 · 调整污泥“年龄”','剩余污泥 1,500 m³/d，浓度 8,500 mg/L，排出干固体 12.75 t/d；SRT 约 14.2 d。','SRT 定义涉及系统污泥存量、排泥与出水固体损失，不能直接用池容 / 排泥水量替代。'],
 dosing:['⑥ 加药 · 点位与投加量','碳源投加缺氧入口 75 kg/h（商品液）；PAC 投加二沉池前 125 kg/h（商品液）。','商品液用量不等于有效成分或 COD 当量；需要药剂浓度与当量才能评价投加强度。'],
 sludge:['活性污泥 · 劳动力体检','MLSS 表示群体规模，MLVSS/MLSS 表示挥发性组分，SRT 表示年龄，F/M 表示任务负荷，SOUR 表示呼吸活性。','比喻用于理解，不替代诊断。SV₃₀ 与 MLSS 联算 SVI；挥发性组分不等于全部活性微生物。']
};
function overviewData(){const stress=overviewState.scenario==='stress';return {...waterxProcessDemo,stress,...(stress?{mlss:6000,mlvss:3600,sv:75,srt:26,fm:.045,sour:6}:{}),do:stress?.22:.48,orp:stress?-80:-135};}
function ovMetrics(){const d=overviewData();return [
 ['MLSS',d.mlss,'mg/L','群体规模',3000,5000,8000,'external'],
 ['MLVSS',d.mlvss,'mg/L','挥发性组分',2000,3500,6000,'sludge'],
 ['VSS / SS',d.mlvss/d.mlss,'','组分占比',.5,.75,1,'sludge'],
 ['SV₃₀',d.sv,'%','沉降体积',20,30,100,'clarifier'],
 ['SVI',d.sv*10000/d.mlss,'mL/g','沉降紧实性',50,150,250,'clarifier'],
 ['SRT',d.srt,'d','污泥年龄',10,20,40,'waste'],
 ['F/M',d.fm,'kg/(kg·d)','任务负荷',.05,.15,.3,'distribution'],
 ['SOUR',d.sour,'mg/(g·h)','呼吸活性',8,20,30,'aeration']];}
function ovHealth(){return `<div class="ov-health"><header><b>活性污泥 <span>劳动力体检 · 点选指标查看工艺关联</span></b><span class="ov-health-key"><i class="ov-dot ok"></i>范围内 <i class="ov-dot watch"></i>关注 <i class="ov-dot high"></i>异常</span><button data-ov-focus="sludge" class="ov-text-button">25 ℃ · 镜检 ↗</button><button data-ov-fullscreen class="ov-text-button" aria-pressed="${fullscreen}">${fullscreen?'退出全屏':'全屏展示'}</button></header><div class="ov-health-grid">${ovMetrics().map(([n,v,u,m,lo,hi,max,focus])=>{const status=n==='SOUR'&&v<8?'high':v<lo||v>hi?'watch':'ok';const value=n==='F/M'?v.toFixed(3):n==='VSS / SS'?v.toFixed(2):Number.isInteger(v)?v.toLocaleString():Number(v.toFixed(1));return `<button class="ov-health-metric ${status} ${overviewState.focus===focus?'linked':''}" data-ov-focus="${focus}" aria-label="${n} ${value} ${u}，参考${lo}至${hi}，查看${m}关联"><div>${n}<span class="ov-health-signal">${status==='ok'?'●':'!'}</span></div><strong>${value}<small>${u}</small></strong><div class="ov-range" title="参考 ${lo}–${hi}；当前 ${value}"><i style="left:${lo/max*100}%;width:${(hi-lo)/max*100}%"></i><b style="left:${Math.min(98,v/max*100)}%"></b></div><p>${m}<span>${lo}–${hi}</span></p></button>`}).join('')}</div></div>`;}
function ovSvgText(x,y,text,cls='',anchor='start'){return `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${text}</text>`;}
function ovLine(d,color,id,cls=''){return `<path class="ov-pipe ${cls}" data-line="${id}" d="${d}" stroke="${color}" marker-end="url(#arrow-${id})"/>`;}
function ovTank(x,w,name,sub,id,rows){return `<g class="ov-unit ${overviewState.focus===id?'selected':''}" data-ov-focus="${id}" role="button" tabindex="0" aria-label="查看${name}工艺参数"><title>${name}：点击查看参数及来源</title><ellipse class="ov-shadow" cx="${x+w/2}" cy="224" rx="${w*.65}" ry="12"/><path class="ov-tank-side" d="M${x+w} 102l24 -19v118l-24 19Z"/><path class="ov-tank-front" d="M${x} 102h${w}v118H${x}Z"/><path class="ov-tank-rim" d="M${x} 102l24 -19h${w}l-24 19Z"/><path class="ov-tank-water" d="M${x+8} 102l19 -13h${w-17}l-19 13Z"/>${ovSvgText(x+12,124,name,'ov-tank-name')}${ovSvgText(x+12,142,sub,'ov-tank-sub')}${rows.map(([k,v,status],i)=>`${ovSvgText(x+12,162+i*17,k,'ov-tank-label')}${ovSvgText(x+w-11,162+i*17,v,'ov-tank-value '+(status||''),'end')}`).join('')}${id==='aerobic'?Array.from({length:9},(_,i)=>`<circle cx="${x+24+i*17}" cy="${i%2?94:97}" r="2.2" fill="#fff"/>`).join(''):''}</g>`;}
function ovDiagram(){const d=overviewData();let focus=overviewState.focus;return `<svg class="ov-process-svg" viewBox="0 0 1200 312" preserveAspectRatio="none" role="group" aria-label="A²O工艺流程，进水依次经过厌氧、缺氧、好氧、二沉池，内回流至缺氧，外回流至厌氧">
<defs>${Object.entries({water:ovColors.water,internal:ovColors.internal,external:ovColors.sludge,waste:ovColors.sludge,air:ovColors.air,dose:ovColors.dose}).map(([id,c])=>`<marker id="arrow-${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${c}"/></marker>`).join('')}<linearGradient id="ov-front" x2="0" y2="1"><stop stop-color="#f2f8fa"/><stop offset="1" stop-color="#deedf2"/></linearGradient></defs>
<g class="ov-flow-layers ${focus==='all'?'':`focus-${focus}`}">
${ovLine('M35 143H183',ovColors.water,'water')}${ovLine('M78 143V65H430V88',ovColors.water,'water')}
${ovLine('M376 143H421 M615 143H655 M879 143H925 M1103 143H1170',ovColors.water,'water')}
${ovLine('M833 101V29H520V81',ovColors.internal,'internal')}
${ovLine('M1002 214V257H227V221',ovColors.sludge,'external')}
${ovLine('M1080 257H1169 M1002 257H1080',ovColors.sludge,'waste')}
${ovLine('M711 70V91 M750 70V91 M789 70V91',ovColors.air,'air')}
${ovLine('M457 73V90 M910 74V135',ovColors.dose,'dose')}
</g>
${ovTank(185,170,'厌氧区','释磷 · 氨化','anaerobic',[['DO','0.02 mg/L','ok'],['ORP','−325 mV','ok'],['HRT / pH','1.5 h / 7.0','']])}
${ovTank(425,170,'缺氧区','反硝化 · 氨化','anoxic',[['DO','0.15 mg/L','ok'],['ORP',d.orp+' mV ↑','high'],['HRT / pH','3.0 h / 7.1','']])}
${ovTank(659,196,'好氧区','硝化 · 吸磷','aerobic',[['末端 DO',d.do.toFixed(2)+' mg/L'+(d.stress?' ↓':''),d.stress?'low':'ok'],['ORP',d.stress?'+42 mV ↓':'+85 mV',d.stress?'low':'ok'],['HRT / pH','9.0 h / 7.7','']])}
<g class="ov-unit ${focus==='clarifier'?'selected':''}" data-ov-focus="clarifier" role="button" tabindex="0" aria-label="查看二沉池"><ellipse class="ov-shadow" cx="1006" cy="223" rx="92" ry="12"/><path d="M932 106Q1010 135 1089 106V183L1009 220 932 183Z" fill="url(#ov-front)" stroke="#a6bfcb"/><ellipse cx="1010" cy="106" rx="78" ry="23" fill="#cfe6eb" stroke="#a6bfcb"/><ellipse cx="1010" cy="106" rx="65" ry="16" fill="#8dcdd9"/><path d="M1009 87V122M955 106H1067" stroke="#709aaa" stroke-width="3"/><path d="M950 180L1009 209 1070 180" fill="#b59875" opacity=".65"/>${ovSvgText(1010,147,'二沉池','ov-tank-name','middle')}${ovSvgText(1010,165,'泥位 1.2 m','ov-tank-value','middle')}${ovSvgText(1010,183,'SS 6.5 mg/L','ov-tank-sub','middle')}</g>
<g class="ov-callout" data-ov-focus="inlet" role="button" tabindex="0" aria-label="查看进水"><rect x="8" y="104" width="133" height="31" rx="5"/>${ovSvgText(74,125,'进水 8.20 万 m³/d','','middle')}${ovSvgText(71,170,'COD 285 · TN 41.2','ov-flow-note','middle')}${ovSvgText(71,188,'上游点源 ↗','ov-flow-note','middle')}</g>
<g class="ov-callout" data-ov-focus="distribution" role="button" tabindex="0" aria-label="查看配水比例">${ovSvgText(178,60,'① 多点进水：厌氧 70% / 缺氧 30%','ov-water-label')}</g>
<g class="ov-callout" data-ov-focus="internal" role="button" tabindex="0" aria-label="查看内回流"><rect x="547" y="14" width="250" height="25" rx="5"/>${ovSvgText(672,31,'③ 内回流 r 195% · 6,663 m³/h','ov-internal-label','middle')}</g>
<g class="ov-callout" data-ov-focus="aeration" role="button" tabindex="0" aria-label="查看曝气"><rect x="648" y="45" width="221" height="29" rx="5"/>${ovSvgText(758,64,'② 曝气 12,600 Nm³/h','ov-air-label','middle')}</g>
<g class="ov-callout" data-ov-focus="dosing" role="button" tabindex="0" aria-label="查看药剂投加点"><rect x="393" y="46" width="135" height="26" rx="5"/>${ovSvgText(460,64,'⑥ 碳源 75 kg/h','ov-dose-label','middle')}<rect x="896" y="46" width="153" height="28" rx="5"/>${ovSvgText(972,64,'⑥ PAC 125 kg/h','ov-dose-label','middle')}</g>
<g class="ov-callout" data-ov-focus="external" role="button" tabindex="0" aria-label="查看外回流"><rect x="396" y="243" width="291" height="28" rx="5"/>${ovSvgText(541,262,'④ 外回流 R 75% · 2,563 m³/h','ov-sludge-label','middle')}</g>
<g class="ov-callout" data-ov-focus="waste" role="button" tabindex="0" aria-label="查看排泥"><rect x="1041" y="270" width="150" height="29" rx="5"/>${ovSvgText(1116,289,'⑤ 排泥 1,500 m³/d','ov-sludge-label','middle')}</g>
${ovSvgText(1140,112,'二沉出水','ov-water-label','middle')}${ovSvgText(1140,169,'8.05 万 m³/d','ov-flow-note','middle')}${ovSvgText(1140,187,'往后续处理 →','ov-flow-note','middle')}
${ovSvgText(273,239,'水位 4.5 m','ov-flow-note','middle')}${ovSvgText(510,239,'水位 4.5 m','ov-flow-note','middle')}${ovSvgText(760,239,'水位 4.5 m · 碱度 110 mg/L','ov-flow-note','middle')}
<g class="ov-flow-bottom">${ovSvgText(185,295,'主水线：厌氧 → 缺氧 → 好氧 → 二沉池；回流按进水 Q 计','ov-flow-note')}${ovSvgText(908,295,'流向示意 · 非空间比例','ov-flow-note','end')}</g>
</svg>`;}
function ovQualityPanel(){const names=['进水','厌氧末端','缺氧末端','好氧末端','二沉出水','最终出水'];const log=overviewState.scale==='log';const x=i=>55+i*119,y=v=>log?117-(Math.log10(Math.max(.1,v))+1)*25:117-v/400*100;const ticks=log?[.1,1,10,100,1000]:[0,100,200,300,400];return `<section class="ov-quality ov-card"><header><b>沿程水质</b><div class="ov-pollutants" aria-label="水质曲线多选">${Object.keys(ovQuality).map(n=>`<button data-ov-pollutant="${n}" class="${overviewState.pollutants.includes(n)?'active':''}" aria-pressed="${overviewState.pollutants.includes(n)}" style="--series:${ovSeriesColors[n]}">${overviewState.pollutants.includes(n)?'☑':'☐'} ${n}</button>`).join('')}</div><button data-ov-scale="${log?'linear':'log'}" class="ov-text-button">${log?'对数轴':'线性轴'} ⇄</button></header><svg class="ov-quality-chart" viewBox="0 0 710 147" preserveAspectRatio="none" role="img" aria-label="多选沿程水质曲线，${overviewState.pollutants.join('、')||'未选择指标'}，${log?'对数':'线性'}浓度轴，单位毫克每升">${ticks.map(t=>`<path d="M45 ${y(t)}H663" stroke="#e4edf2" stroke-dasharray="3 4"/><text x="38" y="${y(t)+3}" text-anchor="end">${t}</text>`).join('')}${overviewState.pollutants.map(n=>{const q=ovSeries(n);let path='';q.values.forEach((v,i)=>{if(v!==null)path+=`${i===0||q.values[i-1]===null?'M':'L'}${x(i)} ${y(v)} `;});return `<path data-series="${n}" d="${path}" stroke="${ovSeriesColors[n]}" fill="none" stroke-width="2"/>${q.values.map((v,i)=>v===null?'':`<circle tabindex="0" aria-label="${names[i]} ${n} ${v} mg/L" data-tip="${names[i]} · ${n}：${v} mg/L${i===5?' / 目标 ≤ '+q.limit:''}" cx="${x(i)}" cy="${y(v)}" r="4" fill="${ovSeriesColors[n]}" stroke="${i===5&&v>q.limit?'#c74c4c':'white'}" stroke-width="${i===5&&v>q.limit?3:1}"><title>${names[i]} · ${n} ${v} mg/L</title></circle>`).join('')}`}).join('')}${names.map((n,i)=>`<text x="${x(i)}" y="140" text-anchor="middle">${n}</text>`).join('')}${!overviewState.pollutants.length?'<text x="350" y="65" text-anchor="middle">请选择上方指标显示曲线</text>':''}</svg><div class="ov-water-results">${Object.keys(ovQuality).map(n=>{const q=ovSeries(n),v=q.values[5];return `<span class="${v>q.limit?'high':''}" style="--series:${ovSeriesColors[n]}"><i></i>${n} <b>${v}${v>q.limit?' ↑':''}</b><small>≤ ${q.limit}</small></span>`}).join('')}</div><div class="ov-quality-foot">最终出水 / 演示目标（mg/L）· ${log?'对数轴便于同看不同量级；':'线性轴按实际浓度；'}SS 中间段未采样，留空不连线。点位可悬停查看。</div></section>`;}
function ovRelations(){const d=overviewData(),svi=d.sv*10000/d.mlss;const mx=v=>40+(v-2000)/5000*168,my=v=>111-(v-10)/80*90;const fx=v=>34+v/.3*176,fy=v=>111-v/40*88;return `<section class="ov-relations ov-card"><header><b>污泥指标 · 关联体检</b><span>同一快照 · 参考区间示意</span></header><div class="ov-relation-plots"><button data-ov-focus="clarifier" aria-label="查看 SV30 MLSS SVI 联合关系"><b>浓度 × 沉降 → SVI</b><svg viewBox="0 0 235 140" preserveAspectRatio="none" role="img" aria-label="MLSS ${d.mlss}，SV30 ${d.sv}，计算SVI ${svi.toFixed(1)}"><text x="4" y="14">SV₃₀ %</text>${Array.from({length:10},(_,xi)=>Array.from({length:8},(_,yi)=>{const v=(15+yi*10)*10000/(2250+xi*500);return `<rect x="${40+xi*16.8}" y="${21+(7-yi)*11.25}" width="16.8" height="11.25" fill="${v>=50&&v<=150?'#cde9dc':v<40||v>200?'#f5d9d7':'#f9ebc9'}"/>`}).join('')).join('')}${[2000,4000,6000].map(v=>`<text x="${mx(v)}" y="125" text-anchor="middle">${v}</text>`).join('')}${[10,50,90].map(v=>`<text x="32" y="${my(v)+3}" text-anchor="end">${v}</text>`).join('')}<circle cx="${mx(d.mlss)}" cy="${my(d.sv)}" r="5" fill="#0877a7" stroke="white" stroke-width="2"/><text x="208" y="138" text-anchor="end">MLSS · mg/L</text></svg><span>SVI <strong>${svi.toFixed(1)}</strong> mL/g · 参考 50–150</span></button><button data-ov-focus="waste" aria-label="查看 F/M SRT 联合关系"><b>任务负荷 × 污泥年龄</b><svg viewBox="0 0 235 140" preserveAspectRatio="none" role="img" aria-label="F/M ${d.fm}，SRT ${d.srt}"><text x="4" y="14">SRT · d</text><rect x="34" y="23" width="176" height="88" fill="#f9ebc9"/><rect x="34" y="23" width="176" height="22" fill="#f5d9d7"/><rect x="34" y="100" width="176" height="11" fill="#f5d9d7"/><rect x="${fx(.05)}" y="${fy(20)}" width="${fx(.15)-fx(.05)}" height="${fy(10)-fy(20)}" fill="#cde9dc"/>${[0,.1,.2,.3].map(v=>`<text x="${fx(v)}" y="125" text-anchor="middle">${v}</text>`).join('')}${[0,20,40].map(v=>`<text x="27" y="${fy(v)+3}" text-anchor="end">${v}</text>`).join('')}<circle cx="${fx(d.fm)}" cy="${fy(d.srt)}" r="5" fill="#0877a7" stroke="white" stroke-width="2"/><text x="210" y="138" text-anchor="end">F/M · kg/(kg·d)</text></svg><span>F/M <strong>${d.fm}</strong> · SRT <strong>${d.srt}</strong> d</span></button></div><div class="ov-quality-foot">绿：参考组合 · 黄：关注组合 · 红：演示异常组合；仅辅助定位，不代替诊断。</div></section>`;}
function ovExplanation(){let [title,body,note]=ovFocus[overviewState.focus]||ovFocus.all;const d=overviewData();if(overviewState.focus==='all')note=d.stress?'异常示例：呼吸活性偏低、污泥龄偏长，最终出水氨氮 / TN 超出演示目标。':'当前关注：SV₃₀ 高于 PPT 参考区间，但 SVI 在范围内；缺氧 ORP 高于参考线。';if(overviewState.focus==='anoxic')note=`当前 ORP ${d.orp} mV，高于 PPT 第8页 < −150 mV 参考线；需结合来水、碳源和回流分析。`;if(['aerobic','aeration'].includes(overviewState.focus))body=`好氧末端 DO ${d.do.toFixed(2)} mg/L，曝气 12,600 Nm³/h；SOUR ${d.sour} mgO₂/(gMLVSS·h)，结合氨氮沿程观察供氧与呼吸状态。`;if(overviewState.focus==='waste')body=`排泥 1,500 m³/d；当前污泥龄 ${d.srt} d，F/M ${d.fm}。排泥影响系统污泥存量与龄期，两者的响应有时间滞后。`;if(overviewState.focus==='sludge')note='镜检示例：少量丝状菌（±）；棕褐色、无异常气味。F/M 按 BOD₅ / MLSS，SOUR 按 O₂ / MLVSS。';return `<section class="ov-explanation" aria-live="polite"><b>${title}</b><div><p>${body}</p><small>${note}</small></div></section>`;}
function processOverviewBoard(){const d=overviewData();return `<div class="process-overview"><section class="ov-flow ov-card" data-focus="${overviewState.focus}">${ovHealth()}<header><b>工艺流程 · 实时参数与调控</b><div class="ov-flow-legend"><span><i style="background:${ovColors.water}"></i>水流</span><span><i style="background:${ovColors.internal}"></i>内回流</span><span><i style="background:${ovColors.sludge}"></i>泥流</span><span><i style="background:${ovColors.air}"></i>空气</span><span><i style="background:${ovColors.dose}"></i>药剂</span></div><div class="ov-status-key"><span class="high">↑ 偏高</span><span class="ok">● 范围内</span><span class="low">↓ 偏低</span></div></header>${ovDiagram()}<div class="ov-causal-strip"><button data-ov-focus="external">外回流 75% ↔ MLSS ${d.mlss}</button><button data-ov-focus="waste">排泥 1,500 ↔ SRT ${d.srt} d</button><button data-ov-focus="aeration">曝气 12,600 ↔ DO ${d.do} ↔ SOUR ${d.sour}</button><button data-ov-focus="distribution">配水 70/30 ↔ F/M ${d.fm}</button></div><div class="ov-flow-reference"><span>HRT / DO / ORP 参考见点位说明；双向连线表示关联，不代表即时定量因果。</span><button data-ov-focus="all">重置关联</button></div></section><div class="ov-bottom">${ovQualityPanel()}${ovRelations()}</div>${ovExplanation()}</div>`;}

return {
 render(isFullscreen=false){fullscreen=isFullscreen;return processOverviewBoard();},
 select(kind,value){
  if(kind==='focus'&&Object.hasOwn(ovFocus,value))overviewState.focus=value;
  if(kind==='pollutant'&&Object.hasOwn(ovQuality,value))overviewState.pollutants=overviewState.pollutants.includes(value)?overviewState.pollutants.filter(n=>n!==value):[...overviewState.pollutants,value];
  if(kind==='scale'&&['log','linear'].includes(value))overviewState.scale=value;
 },
 metrics:()=>ovMetrics(),
 series:name=>ovSeries(name),
};
}
export function observeOverview(root){
 const ovLayoutObserver=new ResizeObserver(entries=>entries.forEach(({target,contentRect})=>{
  const width=contentRect.width,height=contentRect.height;if(width<=0||height<=0)return;
  const baseWidth=Number(target.dataset.baseWidth),baseHeight=Number(target.dataset.baseHeight);
  const viewHeight=baseWidth*height/width,sy=viewHeight/baseHeight;
  target.setAttribute('viewBox',`0 0 ${baseWidth} ${viewHeight}`);
  target.firstElementChild.setAttribute('transform',`scale(1 ${sy})`);
  target.querySelectorAll('text').forEach(text=>{
   text.setAttribute('y',Number(text.dataset.originY)*sy);
   text.setAttribute('transform',`scale(1 ${1/sy})`);
   text.style.fontSize=Number(text.dataset.originFont)*Math.min(1,Math.max(.8,sy))+'px';
  });
 }));
 root.querySelectorAll('.ov-process-svg,.ov-quality-chart,.ov-relation-plots svg').forEach(svg=>{
  const [,,width,height]=svg.getAttribute('viewBox').split(' ').map(Number);
  svg.dataset.baseWidth=width;svg.dataset.baseHeight=height;
  svg.removeAttribute('preserveAspectRatio');
  const group=document.createElementNS('http://www.w3.org/2000/svg','g');
  while(svg.firstChild)group.append(svg.firstChild);svg.append(group);
  svg.querySelectorAll('text').forEach(text=>{text.dataset.originY=text.getAttribute('y');text.dataset.originFont=parseFloat(getComputedStyle(text).fontSize)});
  ovLayoutObserver.observe(svg);
 });
 return ()=>ovLayoutObserver.disconnect();
}
