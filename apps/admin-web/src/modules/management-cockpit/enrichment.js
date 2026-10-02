const C={blue:'#078bc4',aqua:'#20aaa0',orange:'#f28c28',slate:'#829daa'};
const sum=a=>a.reduce((s,v)=>s+v,0),fmt=(n,d=0)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* Independent concept preview. All additions are fixed examples, not regulatory assessments. */
const exPalette=['#078bc4','#20aaa0','#7c82ad','#e6a55a','#91aab6'];
const exText=s=>escapeHtml(String(s));
const exNum=n=>Number.isInteger(n)?String(n):Number(n.toFixed(3)).toString();
function exTip(label){return `data-tip="${exText(label)}" tabindex="0"`;}
function exSvg(label,body,w=600,h=170){return `<svg class="ex-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${exText(label)}" preserveAspectRatio="none">${body}</svg>`;}
function exGrid(max,unit,w=600,h=170){return [0,.5,1].map(f=>`<path d="M42 ${h-30-(h-54)*f}H${w-16}" class="ex-grid"/><text x="35" y="${h-26-(h-54)*f}" text-anchor="end">${exNum(max*f)}</text>`).join('')+`<text x="42" y="12">${unit}</text>`;}
function exWaterfall(d){const w=600,h=170,n=d.rows.length,step=536/n,y=v=>140-v/d.max*116;let prev=0;return exSvg(d.title,exGrid(d.max,d.unit)+d.rows.map(([name,v,total],i)=>{const next=total?v:prev+v,base=total?0:prev,x=48+i*step,b=Math.min(y(next),y(base)),color=total?C.blue:v<0?C.aqua:C.orange;const s=`${i?`<path d="M${x-step+step*.64} ${y(prev)}H${x}" class="ex-link"/>`:''}<rect ${exTip(name+'：'+(total?'':v>0?'+':'')+exNum(v)+' '+d.unit)} x="${x}" y="${b}" width="${step*.64}" height="${Math.max(2,Math.abs(y(next)-y(base)))}" fill="${color}" rx="2"/><text class="ex-value" x="${x+step*.32}" y="${Math.max(18,b-5)}" text-anchor="middle">${total?'':v>0?'+':''}${exNum(v)}</text><text x="${x+step*.32}" y="159" text-anchor="middle">${name}</text>`;prev=next;return s;}).join(''));}
function exScatter(d){const w=600,h=170,x=v=>48+(v-d.xmin)/(d.xmax-d.xmin)*522,y=v=>138-(v-d.ymin)/(d.ymax-d.ymin)*112;return exSvg(d.title,`<rect x="48" y="26" width="522" height="112" fill="#f6fafb"/>${d.quad?`<path d="M309 26V138M48 82H570" class="ex-link"/><text x="56" y="40">${d.quad[0]}</text><text x="560" y="40" text-anchor="end">${d.quad[1]}</text><text x="56" y="128">${d.quad[2]}</text><text x="560" y="128" text-anchor="end">${d.quad[3]}</text>`:''}${[0,.5,1].map(f=>`<path d="M48 ${138-f*112}H570" class="ex-grid"/><text x="40" y="${142-f*112}" text-anchor="end">${exNum(d.ymin+f*(d.ymax-d.ymin))}</text><text x="${48+f*522}" y="153" text-anchor="middle">${exNum(d.xmin+f*(d.xmax-d.xmin))}</text>`).join('')}<text x="48" y="13">${d.yLabel}</text>${d.bubbleLabel?`<text x="570" y="13" text-anchor="end">气泡：${d.bubbleLabel}</text>`:''}<text x="570" y="168" text-anchor="end">${d.xLabel}</text>${d.rows.map(([name,a,b,size],i)=>`<circle ${exTip(name+'：'+d.xLabel+' '+a+'；'+d.yLabel+' '+b+(d.bubbleLabel?'；'+d.bubbleLabel+' '+size:''))} cx="${x(a)}" cy="${y(b)}" r="${d.quad?Math.sqrt(size||5)*3:5}" fill="${d.quad?exPalette[i%3]:C.blue}" fill-opacity=".65" stroke="white" stroke-width="1.5"/>${d.quad?`<text x="${x(a)+8}" y="${y(b)-7}" class="ex-value">${name}</text>`:''}`).join('')}`);}
function exHeat(d){const colors=d.highGood?['#edf3f6','#dbeee8','#b5ddd0','#7fbfab','#4c9d86']:['#edf3f6','#d5eae7','#9dcec8','#61ada9','#e8b476'];return `<div class="ex-heat" style="--cols:${d.cols.length}"><span></span>${d.cols.map(n=>`<small>${n}</small>`).join('')}${d.rows.map(([name,vals])=>`<span>${name}</span>${vals.map((v,i)=>`<b ${exTip(name+' · '+d.cols[i]+'：'+v+d.unit)} style="background:${colors[Math.min(4,Math.floor(v/d.max*4))]}">${v}</b>`).join('')}`).join('')}</div><div class="ex-inline-legend"><span>低</span>${colors.map(c=>`<i style="background:${c}"></i>`).join('')}<span>高 · ${d.unit}</span></div>`;}
function exBullet(d){return `<div class="ex-bullets">${d.rows.map(([name,v,target,max],i)=>`<div ${exTip(`${name}：${v}${d.unit}，参考 ${target}${d.unit}`)}><span>${name}</span><div class="ex-bullet-track"><i style="width:${Math.min(100,v/max*100)}%;background:${exPalette[i%3]}"></i><b style="left:${target/max*100}%"></b></div><strong>${v}<small> / ${target}</small></strong></div>`).join('')}</div><div class="ex-inline-legend">实色：当前　细线：内部示例参考 · ${d.unit}</div>`;}
function exDistribution(d){const max=Math.max(...d.rows.map(r=>r[1]));return `<div class="ex-hist">${d.rows.map(([name,v],i)=>`<div style="--h:${v/max*100}%" ${exTip(name+'：'+v+d.unit)}><b>${v}</b><i style="height:${v/max*100}%;background:${exPalette[i%5]}"></i><span>${name}</span></div>`).join('')}</div><div class="ex-inline-legend">${d.caption||'分组统计'} · ${d.unit}</div>`;}
function exPareto(d){const total=sum(d.rows.map(r=>r[1])),max=Math.ceil(Math.max(...d.rows.map(r=>r[1]))*1.2/2)*2;let acc=0;const pts=[];const body=d.rows.map(([name,v],i)=>{const x=58+i*520/d.rows.length,barH=v/max*116;acc+=v;pts.push([x+28,140-acc/total*116]);return `<rect ${exTip(name+'：'+v+d.unit+'；累计 '+fmt(acc/total*100,1)+'%')} x="${x}" y="${140-barH}" width="56" height="${barH}" fill="${i<2?C.blue:'#a8c8d8'}" rx="2"/><text x="${x+28}" y="${135-barH}" text-anchor="middle" class="ex-value">${v}</text><text x="${x+28}" y="158" text-anchor="middle">${name}</text>`;}).join('');return exSvg(d.title,exGrid(max,d.unit)+body+`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${C.orange}" stroke-width="2"/>${pts.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3" fill="${C.orange}"/>`).join('')}${[0,50,100].map(v=>`<text x="593" y="${144-v/100*116}" text-anchor="end">${v}%</text>`).join('')}<text x="580" y="12" text-anchor="end">累计占比</text>`);}
function exBox(d){const x=v=>115+v/d.max*440;return exSvg(d.title,`<text x="115" y="13">${d.unit} · 箱体 P25–P75 / 中线中位数 / 须线最小–最大</text>${[0,.5,1].map(f=>`<path d="M${x(d.max*f)} 22V145" class="ex-grid"/><text x="${x(d.max*f)}" y="161" text-anchor="middle">${exNum(d.max*f)}</text>`).join('')}${d.rows.map(([name,min,q1,med,q3,max],i)=>{const y=43+i*40;return `<g ${exTip(`${name}：最小${min}，P25 ${q1}，中位${med}，P75 ${q3}，最大${max} ${d.unit}`)}><text x="102" y="${y+4}" text-anchor="end">${name}</text><path d="M${x(min)} ${y}H${x(max)}M${x(min)} ${y-6}v12M${x(max)} ${y-6}v12" stroke="${C.blue}"/><rect x="${x(q1)}" y="${y-11}" width="${x(q3)-x(q1)}" height="22" fill="#c5e4ed" stroke="${C.blue}"/><path d="M${x(med)} ${y-11}v22" stroke="${C.aqua}" stroke-width="3"/><text x="${x(max)+9}" y="${y+4}" class="ex-value">${med}</text></g>`;}).join('')}`);}
function exControl(d){const x=i=>48+i*520/(d.rows.length-1),y=v=>138-(v-d.min)/(d.max-d.min)*110;return exSvg(d.title,`<rect x="48" y="${y(d.high)}" width="520" height="${y(d.low)-y(d.high)}" fill="#e8f5ef"/><text x="48" y="12">${d.unit} · 内部演示控制带 ${d.low}–${d.high}</text>${[d.low,d.target,d.high].map(v=>`<path d="M48 ${y(v)}H568" class="ex-link"/><text x="40" y="${y(v)+4}" text-anchor="end">${v}</text>`).join('')}<polyline points="${d.rows.map(([n,v],i)=>x(i)+','+y(v)).join(' ')}" fill="none" stroke="${C.blue}" stroke-width="2"/>${d.rows.map(([n,v],i)=>`<circle ${exTip(n+'：'+v+d.unit)} cx="${x(i)}" cy="${y(v)}" r="4" fill="${v<d.low||v>d.high?C.orange:C.blue}"/><text x="${x(i)}" y="160" text-anchor="middle">${n}</text>`).join('')}`);}
function exMatrix(d){return `<div class="ex-risk"><div class="ex-risk-y">${d.yLabel}</div><div class="ex-risk-grid">${[4,3,2,1,0].map(y=>[0,1,2,3,4].map(x=>{const n=d.rows.filter(r=>r[1]===x+1&&r[2]===y+1).reduce((s,r)=>s+r[3],0);return `<div ${exTip(`可能性${x+1} / 影响${y+1}：${n}项`)} style="background:${x+y>=6?'#f8e0dd':x+y>=3?'#fcf0d7':'#e6f2ee'}">${n?`<b>${n}</b>`:'·'}</div>`}).join('')).join('')}</div><div class="ex-risk-x">${d.xLabel} →　1　2　3　4　5</div></div>`;}
function exDumbbell(d){const x=v=>110+v/100*435;return exSvg(d.title,`<text x="110" y="13">○ ${d.before||'上期'}　● ${d.after||'本期'} · %</text>${[0,50,100].map(v=>`<path d="M${x(v)} 24V143" class="ex-grid"/><text x="${x(v)}" y="160" text-anchor="middle">${v}</text>`).join('')}${d.rows.map(([name,a,b],i)=>{const y=35+i*25;return `<g ${exTip(`${name}：${a}% → ${b}%`)}><text x="100" y="${y+4}" text-anchor="end">${name}</text><path d="M${x(a)} ${y}H${x(b)}" stroke="#b5d6df" stroke-width="4"/><circle cx="${x(a)}" cy="${y}" r="4" stroke="${C.slate}" fill="white" stroke-width="2"/><circle cx="${x(b)}" cy="${y}" r="5" fill="${C.aqua}"/><text x="${x(b)+9}" y="${y+4}" class="ex-value">${b}</text></g>`;}).join('')}`);}
function exGantt(d){const steps=d.cols.length;return `<div class="ex-gantt" style="--steps:${steps}"><span></span>${d.cols.map(c=>`<small>${c}</small>`).join('')}${d.rows.map(([name,start,end,progress],i)=>`<span>${name}</span><div class="ex-gantt-track" style="grid-column:span ${steps}" ${exTip(`${name}：${d.cols[start]}至${d.cols[end]}，进度${progress}%`)}><i style="left:${start/steps*100}%;width:${(end-start+1)/steps*100}%;--fill:${progress}%;--bar:${exPalette[i%3]}"><b>${progress}%</b></i></div>`).join('')}</div>`;}
function exSteps(d){return `<div class="ex-steps">${d.rows.map(([name,value],i)=>`<div><i>${i+1}</i><span>${name}</span><strong>${value}<small>${d.unit}</small></strong></div>`).join('')}</div><div class="ex-inline-legend">${d.caption}</div>`;}
function exTiles(d){return `<div class="ex-tiles">${d.rows.map(([name,v,group])=>`<div ${exTip(group+' · '+name+'：得分率'+v+'%')} class="${v<85?'watch':''}"><span>${name}</span><strong>${v}<small>%</small></strong><i style="--fill:${v}%"></i></div>`).join('')}</div>`;}
const exRender={waterfall:exWaterfall,scatter:exScatter,heat:exHeat,bullet:exBullet,hist:exDistribution,pareto:exPareto,box:exBox,control:exControl,matrix:exMatrix,dumbbell:exDumbbell,gantt:exGantt,steps:exSteps,tiles:exTiles};
export const exBoards={
 operations:[
  {title:'分区负荷热力',type:'heat',period:'昨日 · 分时样例',unit:'% 设计负荷',max:110,cols:['00–04','04–08','08–12','12–16','16–20','20–24'],rows:[['A线',[68,72,91,85,96,78]],['B线',[70,75,88,82,93,76]],['C线',[65,70,86,80,90,74]]],insight:'晚高峰负荷较集中，可结合均衡配水观察。',note:'以各线设计能力为分母；色阶仅表示相对负荷，不表示排放风险。'},
  {title:'全厂水量去向',type:'waterfall',period:'昨日 · 水量核对',unit:'万 m³',max:9,rows:[['进水',8.2,true],['厂内回用',-.06],['外运含水',-.02],['待核差额',-.09],['外排',8.03,true]],insight:'待核差额 900 m³，占进水约 1.1%。',note:'8.20 − 0.06 − 0.02 − 0.09 = 8.03。计量时段、储水变化和计量误差均需核对，差额不直接视为漏损。'},
  {title:'处理负荷与吨水电耗',type:'scatter',period:'近14日 · 工况对照',xmin:55,xmax:100,ymin:.24,ymax:.42,xLabel:'处理负荷 / %',yLabel:'吨水电耗 / kWh/m³',rows:[['01日',61,.38],['02日',65,.36],['03日',68,.35],['04日',73,.33],['05日',77,.32],['06日',82,.3],['07日',85,.31],['08日',88,.3],['09日',92,.32],['10日',74,.35],['11日',79,.31],['12日',84,.29],['13日',89,.3],['14日',94,.33]],insight:'同等负荷下仍有差异，可进一步核对曝气与运行组合。',note:'独立配对样例，用于展示工况分布；相关分布不代表因果或节能收益。'}
 ],
 process:[
  {title:'工艺线目标带对照',type:'bullet',period:'当前快照 · 好氧 DO',unit:'mg/L',rows:[['A线',2.1,2.5,4],['B线',2.8,2.5,4],['C线',1.9,2.5,4]],insight:'B线高于示例参考值，结合末端氨氮判断。',note:'仅示范各线同类测点对比；2.5是内部展示参考，不是普适工艺控制标准。'},
  {title:'各线 DO 波动分布',type:'box',period:'昨日 · 各线24个整点',unit:'mg/L',max:4,rows:[['A线',1.3,1.8,2.1,2.4,2.9],['B线',1.6,2.3,2.8,3.1,3.7],['C线',1.1,1.6,1.9,2.2,2.6]],insight:'B线中位数和波动上界较高，优先检查空气分配。',note:'五数概括是设计样例，反映全天分布，不与当前快照强制相等；不替代工艺诊断。'},
  {title:'COD 负荷削减分解',type:'waterfall',period:'昨日 · 示范核算',unit:'t/d',max:25,rows:[['进厂',23.37,true],['预处理',-1.89],['生化',-18.86],['沉淀',-.9],['深度段',-.19],['出厂',1.53,true]],insight:'主要削减发生于生化段，贡献约 86.4%。',note:'按示例水量与分段负荷设计，阶段差值不等同于严格物料衡算；回流及储量变化暂未纳入。'}
 ],
 equipment:[
  {title:'维护计划兑现',type:'bullet',period:'本月 · 工单',unit:'项',rows:[['预防保养',12,14,16],['定期点检',20,22,24],['校准检定',5,6,8]],insight:'3类计划合计仍有5项待完成。',note:'维护计划与故障维修是不同对象；此处为计划执行示范，不并入原24张维修工单分母。'},
  {title:'故障原因集中度',type:'pareto',period:'近90日 · 已分类事件',unit:'次',rows:[['密封渗漏',9],['电气故障',6],['轴承磨损',4],['堵塞卡阻',3],['其他',2]],insight:'前两类占 62.5%，适合优先完善预防措施。',note:'24次历史故障事件与当前2台故障设备分开统计；橙线是累计事件占比，不是故障概率。'},
  {title:'设备更新关注矩阵',type:'scatter',period:'关键设备样本 · 内部评分',xmin:0,xmax:10,ymin:0,ymax:10,xLabel:'维护负担指数 / 0–10',yLabel:'运行重要性 / 0–10',bubbleLabel:'年维修费 / 万元',quad:['重点保全','更新关注','常规维护','检修优化'],rows:[['鼓风机',7.6,8.6,10],['提升泵',3.2,8.4,9],['回流泵',6.8,6.7,8],['脱水机',7.9,4.4,11],['搅拌器',3.1,3.2,7]],insight:'鼓风机与回流泵位于较高关注象限。',note:'二维评分与气泡大小均为示例，大小表示样例年度维修费用；不是法定资产风险等级或自动采购建议。'}
 ],
 laboratory:[
  {title:'检验结果出具时效',type:'hist',period:'近7日 · 已完成样品',unit:'份',rows:[['≤4h',12],['4–8h',21],['8–24h',9],['>24h',3]],caption:'按采样至结果出具分组',insight:'45份中，33份在8小时内完成。',note:'样品数量与原始记录数量不同；不同检测方法耗时不同，不将24小时统一当作超期线。'},
  {title:'标准样回收率观察',type:'control',period:'近10批 · COD质控',unit:'%',min:85,max:115,low:90,high:110,target:100,rows:[['01',98],['02',101],['03',99],['04',103],['05',100],['06',97],['07',104],['08',112],['09',101],['10',99]],insight:'第08批位于示例控制带外，需追踪复测。',note:'90%–110%仅为图表演示带，不能替代检测方法规定、实验室质控规程或仪器适用范围；不同于当前60组质控统计周期。'},
  {title:'样品流转节点',type:'gantt',period:'今日 · 重点样品',cols:['采样','接收','检测','复核','归档'],rows:[['进水混合样',0,4,100],['出水混合样',0,3,80],['污泥样',0,2,60],['平行复测样',1,2,40]],insight:'出水样已进入复核，复测样仍处于检测环节。',note:'节点进度用于演示流程，进度百分比仅表示已完成节点比例的概念值，不是正式LIMS记录。'}
 ],
 safety:[
  {title:'未闭环隐患滞留',type:'hist',period:'当前 · 未闭环4项',unit:'项',rows:[['≤3天',2],['4–7天',1],['8–14天',1],['>14天',0]],caption:'按发现至今的天数分组',insight:'1项滞留超过7天，结合具体整改期限跟进。',note:'滞留天数不等于逾期天数；是否逾期仍按各事项承诺期限判断。'},
  {title:'重点场景风险关注',type:'matrix',period:'当前 · 8项示例场景',xLabel:'发生可能性',yLabel:'影响 ↑',rows:[['有限空间',2,5,2],['临时用电',3,3,2],['药剂搬运',3,2,2],['临边作业',2,3,1],['动火',2,4,1]],insight:'优先核对高影响场景的隔离、监护及应急条件。',note:'1–5内部示意尺度，格内为场景数量；不是法定重大隐患认定，也不以数量和颜色替代专业风险评价。'},
  {title:'岗位培训覆盖变化',type:'dumbbell',period:'上月 → 本月 · %',before:'上月',after:'本月',rows:[['运行岗位',80,100],['设备岗位',75,90],['化验岗位',85,100],['外协人员',60,80]],insight:'外协覆盖改善较大，仍有补训空间。',note:'按各岗位应培训人员计算，示例人员池与原有本月26人培训任务可不同；不据此认定人员资质合格。'}
 ],
 inventory:[
  {title:'ABC 物资管理分层',type:'steps',period:'期末 · 按金额贡献分组',unit:'种',rows:[['A类 · 70%金额',22],['B类 · 20%金额',48],['C类 · 10%金额',116]],caption:'186种物资 · 分类阈值为内部示例',insight:'A类品种少、金额集中，可加强采购与库存核对。',note:'按金额贡献划分管理关注层级，不表示物料关键性；药剂和备件仍需分别设置安全库存。'},
  {title:'库存库龄结构',type:'hist',period:'期末 · 账面金额',unit:'万元',rows:[['≤30天',22.4],['31–90天',15.2],['91–180天',7.3],['>180天',3.7]],caption:'合计48.6万元',insight:'超过90天合计11.0万元，占22.6%。',note:'库龄不等于保质期，长库龄也不自动视为呆滞；需结合物资用途、保质期及维护需求。'},
  {title:'采购交付节点',type:'gantt',period:'9月 · 重点采购示例',cols:['第1周','第2周','第3周','第4周','第5周'],rows:[['泵机械密封',0,2,70],['PAC补货',1,3,45],['标准溶液',1,2,85],['应急防护',2,4,25]],insight:'机械密封库存偏低，优先追踪到货与验收节点。',note:'进度是示例履约值，不表示已下单或承诺到货；进度与保障天数需要一并查看。'}
 ],
 business:[
  {title:'结算办理进度',type:'steps',period:'本月 · 账单数量',unit:'份',rows:[['待对账',2],['待开票',1],['待回款',2],['已结清',7]],caption:'12份账单 · 互斥状态',insight:'5份尚未结清，优先确认付款前置条件。',note:'按账单份数展示，与175万元已确认收入、当月到期150万元并非同一分母。'},
  {title:'吨水成本变化归因',type:'waterfall',period:'上期 → 本期 · 示例归因',unit:'元/m³',max:.9,rows:[['上期',.82,true],['电耗改善',-.03],['药剂变化',-.01],['污泥处置',.008],['人工摊销',-.012],['其他',-.005],['本期',.771,true]],insight:'示例净变化 −0.049 元/m³，电耗项贡献较大。',note:'桥接值用于呈现分析方法，尚未做水量、负荷、价格等同口径校正，不等于已验证节约收益。'},
  {title:'预算与时间进度对照',type:'dumbbell',period:'截至18日 · 已过60%月份',before:'时间进度',after:'预算使用率',rows:[['电费',60,57.8],['药剂',60,57.3],['污泥处置',60,59.4],['人工',60,60.4],['其他',60,52.5]],insight:'人工接近时间进度，其他费用尚有较大余量。',note:'各项按已发生/预算计算并四舍五入；时间进度并非业务支出均匀发生的假设。'}
 ],
 efficiency:[
  {title:'资源效率参考对照',type:'bullet',period:'当前观察期 · 指数化',unit:'指数',rows:[['电耗强度',93.8,100,120],['药耗强度',96.2,100,120],['产泥强度',98.5,100,120]],insight:'以各自基期=100展示，降幅仍需同工况核验。',note:'三项独立归一化，不可直接求和；电耗0.300/0.320≈93.8，其余为独立示例观察值。'},
  {title:'进水氨氮与曝气强度',type:'scatter',period:'近14日 · 配对观察',xmin:15,xmax:40,ymin:1,ymax:3,xLabel:'进水氨氮 / mg/L',yLabel:'气水比 / Nm³/m³',rows:[['01',18,1.3],['02',21,1.6],['03',23,1.5],['04',26,1.8],['05',28,1.7],['06',30,2.1],['07',32,2.2],['08',34,2.6],['09',36,2.5],['10',38,2.8],['11',26,2.3],['12',31,2.6],['13',33,2.1],['14',24,1.5]],insight:'同等氨氮下供气差异可作为进一步核验线索。',note:'只展示统计关系，未控制温度、回流、DO及负荷等混杂因素，不据此自动修改曝气。'},
  {title:'优化机会优先级',type:'scatter',period:'4项备选 · 内部讨论',xmin:0,xmax:10,ymin:0,ymax:10,xLabel:'实施难度 / 0–10',yLabel:'预期改善空间 / 0–10',bubbleLabel:'预计投入 / 人日',quad:['优先核验','专项论证','顺手改善','谨慎投入'],rows:[['曝气分配',3,8,10],['投药点优化',4.1,6.8,9],['泵组组合',2.5,4.1,7],['设备改造',8,7.6,12]],insight:'优先验证低难度机会，同时保留出水保护指标。',note:'气泡大小示意资源投入，二维值为概念评分；预期空间不是承诺收益或已完成项目。'}
 ],
 evaluation:[
  {title:'待跟踪问题优先级',type:'hist',period:'本轮 · 去重18项',unit:'项',rows:[['优先',3],['常规',9],['观察',6]],caption:'内部跟踪分组',insight:'先处理3项优先事项，保留事实和证据关联。',note:'管理跟踪优先级不等于安全隐患法定等级；全部问题按主责去重。'},
  {title:'证据链完备度',type:'heat',highGood:true,period:'本轮 · 五模块',unit:'% 完备率',max:100,cols:['记录','签认','附件','复核'],rows:[['运行',[100,96,91,91]],['设备',[95,90,81,86]],['化验',[100,100,96,96]],['安全',[96,91,87,91]],['综合',[95,90,86,86]]],insight:'设备附件与综合附件相对薄弱，适合补证复核。',note:'各单元格按本模块相应证据对象计算，彼此分母不同；不与检查符合率混同。'},
  {title:'整改前后复评对照',type:'dumbbell',period:'同批样例 · 符合率',before:'初评',after:'复评',rows:[['运行管理',72,88],['设备管理',68,84],['化验管理',86,96],['安全管理',70,87],['综合管理',74,90]],insight:'设备和安全改善明显，仍需保留未关闭事项。',note:'为独立同批复评示例，不回填当前131项检查的结论分布，也不替代真实复评记录。'}
 ],
 quality:[
  {title:'评价证据时效',type:'hist',period:'当前 · 18项指标',unit:'项',rows:[['本期更新',13],['上期延用',3],['待更新',2]],caption:'有示例数据 ≠ 全部已更新',insight:'2项证据待更新，发布评价前优先核对。',note:'有数据、数据时效和已审核为不同状态；图中分组只展示时效，不自动改变既有示例得分。'},
  {title:'18项指标得分率分布',type:'tiles',period:'同一讨论规则 · 示意项',rows:[['许可履约',100,'合法合规'],['台账完整',95,'合法合规'],['报告及时',93,'合法合规'],['出水质量',100,'稳定达标'],['波动控制',94,'稳定达标'],['异常响应',92,'稳定达标'],['污泥去向',94,'稳定达标'],['风险防控',92,'安全运行'],['作业落实',91,'安全运行'],['整改复核',87,'安全运行'],['电耗',84,'经济高效'],['药耗',86,'经济高效'],['处置成本',79,'经济高效'],['设施效率',82,'经济高效'],['资产利用',83,'经济高效'],['资源回收',76,'经济高效'],['预算管控',80,'经济高效'],['改进兑现',78,'经济高效']],insight:'低分集中在经济高效相关项，可与措施台账关联。',note:'指标名称与单项得分率为视觉示意，不是对正式18项评分规则的改写；不据此重新计算总分。'},
  {title:'四维失分贡献',type:'waterfall',period:'同一规则版本 · 总分桥接',unit:'分',max:105,rows:[['满分',100,true],['合法合规',-.8],['稳定达标',-1.5],['安全运行',-2],['经济高效',-5.7],['本期',90,true]],insight:'经济高效贡献 57% 的失分，是本期主要关注方向。',note:'失分分别来自20−19.2、30−28.5、20−18、30−24.3；四维得分仍沿用现有示例，未改变权重。'}
 ],
 improvement:[
  {title:'已关闭事项周期',type:'hist',period:'本期 · 已关闭16项',unit:'项',rows:[['≤3天',4],['4–7天',7],['8–14天',4],['>14天',1]],caption:'未结项不并入关闭周期',insight:'11项在7天内关闭，仍有1项超过14天。',note:'分组样例与平均6.2天可同时成立；分组不直接用于重新计算精确平均值。'},
  {title:'重点措施实施排期',type:'gantt',period:'9月 · 重点事项',cols:['第1周','第2周','第3周','第4周','第5周'],rows:[['曝气分配优化',0,3,80],['保养记录完善',1,2,70],['出入库口径统一',1,4,45],['复发原因复核',2,3,25]],insight:'实施与效果复核分开推进，避免完成动作即关闭。',note:'日期和百分比为排期样例，未产生执行任务或改动正式记录。'},
  {title:'问题原因集中度',type:'pareto',period:'本期 · 已分类24项',unit:'项',rows:[['执行遗漏',8],['标准不清',6],['信息断点',5],['资源不足',3],['其他',2]],insight:'执行与标准类占 58.3%，适合沉淀检查点和作业指引。',note:'每项问题只归入一个主因；只是原因分类示范，不把统计频次等同于已完成根因调查。'}
 ]
};
export function exPanel(d,key){return `<section class="panel ex-panel" data-ex-key="${key}"><header class="panel-head"><h2>${d.title}</h2><button class="ex-detail" data-ex-detail="${key}" aria-label="查看${d.title}明细">明细 ↗</button></header><div class="ex-meta">${d.period}<span>示例</span></div><div class="ex-visual">${exRender[d.type](d)}</div><div class="ex-insight">${d.insight}</div></section>`;}
export function exDetailRows(d){
 if(d.type==='heat')return {heads:['对象',...d.cols],rows:d.rows.map(([n,v])=>[n,...v])};
 const headers={waterfall:['环节','值（'+d.unit+'）','性质'],scatter:['样本',d.xLabel,d.yLabel,...(d.bubbleLabel?[d.bubbleLabel]:[])],bullet:['项目','当前','参考','展示轴上限'],hist:['分组','数量 / '+d.unit],pareto:['主因','数量 / '+d.unit],box:['对象','最小','P25','中位数','P75','最大'],control:['批次','回收率 / %'],matrix:['场景','可能性','影响','数量'],dumbbell:['对象',d.before||'上期',d.after||'本期'],gantt:['事项','开始节点','结束节点','进度 / %'],steps:['分组','数量 / '+d.unit],tiles:['示意指标','得分率 / %','维度']};
 let rows=d.rows;
 if(d.type==='waterfall')rows=rows.map(([n,v,total])=>[n,v,total?'合计':'变动']);
 if(d.type==='gantt')rows=rows.map(([n,a,b,v])=>[n,d.cols[a],d.cols[b],v]);
 if(d.type==='scatter')rows=rows.map(([n,a,b,r])=>[n,a,b,...(d.bubbleLabel?[r]:[])]);
 return {heads:headers[d.type],rows};
}

// Only enrich the mounted Vue content; no document/global listeners or server data.
export function enrichBoard(content,topic){
 const defs=exBoards[topic],grid=content.querySelector('.dashboard-grid');
 content.classList.toggle('enriched',!!defs);
 if(!defs||!grid)return;
 grid.querySelectorAll('.ex-panel').forEach(el=>el.remove());
 const original=[...grid.children];
 original.forEach((p,i)=>{p.classList.add('ex-original');p.dataset.original=String(i)});
 grid.insertAdjacentHTML('beforeend',defs.map((d,i)=>exPanel(d,topic+':'+i)).join(''));
 const added=[...grid.querySelectorAll('.ex-panel')];
 grid.insertBefore(added[0],original[2]);
 [...grid.children].forEach((p,i)=>p.dataset.position=String(i));
}
export function getDetail(key){const [topic,index]=key.split(':');const definition=exBoards[topic]?.[Number(index)];return definition?{...definition,...exDetailRows(definition)}:null}
