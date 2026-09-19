import D from './case-data.json' with {type:'json'}
export {D}
export function createSimulation(){
const entities=new Map([...D.facilities,...D.equipment].map(x=>[x.id,x]));
let scenario='alerts',tick=0;
function currentTime(){const mins=480+tick*15;return `2026-09-19 ${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;}
function includesScenario(name){return scenario==='alerts'||scenario===name;}
function status(a){if(a.id==='BL-02'&&includesScenario('fault'))return '故障停机';if(a.id==='DO-01'&&includesScenario('offline'))return '离线';if(a.id==='BL-01'&&includesScenario('temperature'))return '温度预警';if(a.id==='PRE-01'&&includesScenario('gas'))return '气体报警';return a.status||'示例运行';}
function signalValue(s,t=tick){
 const owner=entities.get(s.owner),tag=s.id.split('.').pop();
 if(s.owner==='DO-01'&&includesScenario('offline'))return null;
 if(s.id==='BL-01.TEMP'&&includesScenario('temperature'))return 78.4+Math.sin(t*.28)*.5;
 if(s.id==='PRE-01.H2S'&&includesScenario('gas'))return 12.6+Math.sin(t*.28)*.2;
 if(s.owner==='BL-02'&&includesScenario('fault')){
  if(tag==='FAULT')return 1;
  if(['RUN','CURRENT','FREQ'].includes(tag))return 0;
 }
 if(owner?.status==='备用'&&['CURRENT','FREQ'].includes(tag))return 0;
 if(s.io==='DI'||s.io==='MANUAL'||['LEVEL','HOURS','MOISTURE'].includes(tag))return s.value;
 let v=s.value;
 if(includesScenario('fault')&&(s.id==='AIR-01.FLOW'||s.name==='供气流量'))v*=2/3;
 const seed=[...s.id].reduce((a,c)=>a+c.charCodeAt(0),0);
 const scale=s.unit==='无量纲'?.006:s.unit==='°C'?.01:.025;
 return v*(1+Math.sin(t*.28+seed*.11)*scale);
}
function displaySignal(s,v){if(v===null)return '— 离线';if(s.io==='DI'){const tag=s.id.split('.').pop();return tag==='RUN'?(v?'运行':'停止'):tag==='FAULT'?(v?'故障':'无故障'):tag==='PROTECT'?(v?'报警':'无报警'):(v?'远程':'就地');}const decimals=['mg/L','m','mm/s','°C','无量纲'].includes(s.unit)?(Math.abs(v)<10?2:1):['Hz','ppm'].includes(s.unit)?1:0;return Number(v).toLocaleString('zh-CN',{maximumFractionDigits:decimals})+' '+s.unit;}
const riskDefinitions=[
 {id:'blower-fault',object:'BL-02',location:'AIR-01',level:'alarm',category:'设备',title:'2 号风机故障',signal:'BL-02.FAULT',test:v=>v===1,value:()=> '故障 = 1 · 已停机',basis:'故障信号 = 1；运行信号 = 0',impact:'可用供气能力下降，需核对机组状态与现场故障记录。',focus:'检查故障记录、关联供气数据及备用机组状态。'},
 {id:'gas-alarm',object:'PRE-01',location:'PRE-01',level:'alarm',category:'安全',title:'进水泵房气体报警',signal:'PRE-01.H2S',test:v=>v!==null&&v>=10,basis:'模拟硫化氢 ≥ 10 ppm（仅演示触发线）',impact:'固定气体测点触发报警，提示关注现场环境风险。',focus:'交由现场人员按既有气体报警与安全处置程序核验；画面不构成人员进入许可。'},
 {id:'bearing-temperature',object:'BL-01',location:'AIR-01',level:'warning',category:'设备',title:'1 号风机温度偏高',signal:'BL-01.TEMP',test:v=>v!==null&&v>=75,basis:'模拟轴承温度 ≥ 75 °C（仅演示触发线）',impact:'设备状态偏离示例基线，需要结合趋势、负荷和维护记录核验。',focus:'查看温度趋势、振动和维护档案；具体限值以实际设备配置为准。'},
 {id:'do-offline',object:'DO-01',location:'BIO-01',level:'warning',category:'仪表',title:'1 组 DO 测点离线',signal:'DO-01.VALUE',test:v=>v===null,value:()=> '离线 · 数据缺失',basis:'模拟数据质量状态 = 离线',impact:'该测点无法反映当前溶解氧，不代表 DO 为零或工艺正常。',focus:'核对仪表通信与维护记录，必要时由现场人员补充检测。'}
];
function activeRisks(){return riskDefinitions.filter(r=>r.test(signalValue(D.signals.find(s=>s.id===r.signal))));}
function riskValue(r){const s=D.signals.find(s=>s.id===r.signal);return r.value?r.value():displaySignal(s,signalValue(s));}

return {currentTime,status,signalValue,displaySignal,activeRisks,riskValue,setScenario(value){if(!['alerts','normal','fault','offline','temperature','gas'].includes(value))throw new Error('未知模拟情景');scenario=value},setTick(value){if(!Number.isInteger(value)||value<0||value>24)throw new Error('无效回放时刻');tick=value}}
}
