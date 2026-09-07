import { type Metric, type LegacyMetric, type Target, type TargetMode, type Cell, type ResultRow, type ProjectState, type ConditionVersion, latest, modeLabels } from './types'

export const RULE_VERSION = 'PM-0.1.1（项目参数待校核）'
const key = (category: string, name: string) => `${category}::${name}`
export function makeCatalog(items: LegacyMetric[]): Metric[] {
  return items.map(m => ({ ...m, id: key(m.category, m.name), text: ['文本','定性'].includes(m.unit),
    source: m.formula ? 'CALCULATED' : !m.scopes.includes('entry') && m.scopes.includes('design') && !m.scopes.includes('condition') ? 'DESIGN' : 'MANUAL' }))
}
// Full-string parsing: scientific notation is accepted; units, qualifiers and trailing text are not silently discarded.
export function numeric(value: string | undefined): number | null {
  let s = (value ?? '').trim()
  if (!s) return null
  s = s.replace(/([0-9.]+)\s*[×x]\s*10([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)/g, (_, a, p: string) => `${a}e${[...p].map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'.includes(c)?'⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c):'-').join('')}`)
    .replace(/^10([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)$/, (_, p: string) => `1e${[...p].map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'.includes(c)?'⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c):'-').join('')}`)
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s)) return null
  const n = Number(s); return Number.isFinite(n) ? n : null
}
export function bounds(value: string): [number, number] | null {
  const match = value.trim().match(/^([+-]?\d+(?:\.\d+)?)\s*[～~至]\s*([+-]?\d+(?:\.\d+)?)$/)
  if (!match) return null
  const a=Number(match[1]), b=Number(match[2]); return a<=b ? [a,b] : null
}
export function targetFor(m: Metric): Target {
  let mode: TargetMode = m.text ? 'TEXT' : bounds(m.target) ? 'RANGE' : m.target.includes('≤') ? 'UPPER' : m.target.includes('≥') ? 'LOWER' : m.category==='出水水质' ? 'UPPER' : m.category==='处理效能' && /去除率/.test(m.name) ? 'LOWER' : 'POINT'
  if (!m.text && numeric(m.target.replace(/[≤≥]/g,''))===null && !bounds(m.target)) mode='REFERENCE'
  return { value: m.target.replace(/[≤≥]/g,''), mode, warning: 10, alarm: 50 }
}
export function targetError(t: Target) {
  if (!Number.isFinite(t.warning) || !Number.isFinite(t.alarm) || t.warning<0 || t.alarm<t.warning) return '容差必须是非负数，告警容差不得小于预警容差'
  if (!t.value.trim() || t.value==='—') return '' // Missing targets remain explicitly unassessed.
  if (t.mode==='RANGE' && !bounds(t.value)) return '区间请填写“下限～上限”，且下限不得大于上限'
  if (['POINT','UPPER','LOWER'].includes(t.mode) && numeric(t.value)===null) return '目标必须为完整数字'
  return ''
}
export function displayTarget(t?: Target) { return t ? `${t.mode==='UPPER'?'≤':t.mode==='LOWER'?'≥':''}${t.value}` : '未配置' }
export function matchCondition(state: ProjectState, line: string, date: string) {
  const matches=state.conditions.map(c=>({id:c.id,value:latest(c.versions)})).filter(c=>c.value.status==='ACTIVE'&&c.value.line===line&&c.value.from<=date&&date<=c.value.to)
  return matches.length===1?matches[0]:undefined
}
export function matchDesign(state: ProjectState, date: string) {
  return state.designs.filter(d=>d.effective<=date).sort((a,b)=>b.effective.localeCompare(a.effective)||b.version-a.version)[0]
}
export function conditionError(state: ProjectState, id: string, c: ConditionVersion) {
  if (!c.name.trim() || !c.from || !c.to || c.from>c.to) return '请填写工况名称和有效的起止日期'
  if (c.status==='ACTIVE' && state.conditions.some(other=>other.id!==id&&latest(other.versions).status==='ACTIVE'&&latest(other.versions).line===c.line&&c.from<=latest(other.versions).to&&latest(other.versions).from<=c.to)) return '同一工艺线的已启用工况日期不能重叠'
  for(const t of Object.values(c.targets)){const error=targetError(t); if(error)return error}
  return ''
}
type Formula = { description: string; run: (read: (id: string, design?: boolean)=>number)=>number }
const formulas: Record<string, Formula> = {}
const add=(c:string,n:string,description:string,run:Formula['run'])=>{formulas[key(c,n)]={description,run}}
const div=(a:number,b:number)=>{if(b===0)throw new Error('分母为0');return a/b}
for(const [name,a,b] of [['VFA/COD','VFA','COD'],['SCOD/COD','SCOD','COD'],['BOD₅/COD','BOD₅','COD'],['SS/COD','SS','COD'],['COD/TN','COD','TN'],['BOD₅/TN','BOD₅','TN'],['碱度/NH₃-N','总碱度','NH₃-N'],['NH₃-N/TN','NH₃-N','TN'],['COD/TP','COD','TP'],['BOD₅/TP','BOD₅','TP'],['PO₄-P/TP','PO₄-P','TP']] as const) add('进水特征',name,`进水${a} ÷ 进水${b}（相同采样日、浓度口径）`,r=>div(r(key('进水水质',a)),r(key('进水水质',b))))
for(const name of ['COD','BOD₅','SS','NH₃-N','TN','TP']) add('处理效能',`${name}去除率`,`(进水${name}－出水${name}) ÷ 进水${name} × 100；浓度法，非质量负荷去除率`,r=>div(r(key('进水水质',name))-r(key('出水水质',name)),r(key('进水水质',name)))*100)
add('污泥性状','MLVSS/MLSS','MLVSS ÷ MLSS',r=>div(r('污泥性状::MLVSS'),r('污泥性状::MLSS')))
add('污泥性状','SVI','SV30(%) × 10000 ÷ MLSS(mg/L)，结果mL/g',r=>div(r('污泥性状::SV30')*10000,r('污泥性状::MLSS')))
// Concentration ratios are not F/M loads: preserve names but disclose the actual dimensional meaning.
for(const [name,a,b] of [['BOD₅/MLSS','BOD₅','MLSS'],['COD/MLSS','COD','MLSS'],['BOD/MLVSS','BOD₅','MLVSS'],['NH₃/MLVSS','NH₃-N','MLVSS'],['TN/MLVSS','TN','MLVSS'],['NO₃-N/MLSS','NO₃-N','MLSS']] as const) add('污泥性状',name,`进水${a} ÷ ${b}；仅浓度比，非F/M负荷或反应速率`,r=>div(r(key('进水水质',a)),r(key('污泥性状',b))))
const flow='水量控制::日进水量'
add('水量控制','水量负荷率','日进水量 ÷ 设计处理水量 × 100（同为万m³/d）',r=>div(r(flow),r('水量控制::设计处理水量',true))*100)
for(const section of ['厌氧段','缺氧段','好氧段']) add('水量控制',`${section}HRT`,`${section}有效池容(万m³) ÷ 日进水量(万m³/d) × 24；未计回流`,r=>div(r(key('水量控制',`${section}有效池容`),true),r(flow))*24)
add('水量控制','总HRT','厌氧＋缺氧＋好氧有效池容 ÷ 日进水量 × 24；未计回流，不含二沉池',r=>div(['厌氧段','缺氧段','好氧段'].reduce((s,n)=>s+r(key('水量控制',`${n}有效池容`),true),0),r(flow))*24)
add('曝气控制','单位水量曝气量','日曝气量(万Nm³) ÷ 日进水量(万m³)',r=>div(r('曝气控制::日曝气量'),r(flow)))
add('曝气控制','当前气水比','日累计曝气量(万Nm³) ÷ 同日进水量(万m³)；日均口径，不以瞬时风量代替日累计量',r=>div(r('曝气控制::日曝气量'),r(flow)))
for(const name of ['内回流','外回流']) add('回流控制',`${name}比`,`${name}量(万m³/d) ÷ 日进水量(万m³/d) × 100`,r=>div(r(key('回流控制',`${name}量`)),r(flow))*100)
add('加药控制','吨水药耗','(碳源投加量＋除磷药剂量)(t/d) × 1000 ÷ [日进水量(万m³/d) × 10000]；按商品药剂质量',r=>div((r('加药控制::碳源投加量')+r('加药控制::除磷药剂量'))*1000,r(flow)*10000))
add('曝气控制','填料投加容积比','投加填料总体积 ÷ MBBR填料区池容 × 100（同为m³）',r=>div(r('曝气控制::投加填料总体积',true),r('曝气控制::MBBR填料区池容',true))*100)
// Fluidization ratio stays unconfigured until flow measurement period and gas state are agreed.
export function formulaDescription(m: Metric) { return formulas[m.id]?.description || (m.source==='CALCULATED'?'待补充项目模型、明确输入与公式；不得使用预置结果':'') }
export function calculateRows(metrics: Metric[], design: Record<string,string>, targets: Record<string,Target> | undefined, cells: Record<string,Cell>): ResultRow[] {
  const cache=new Map<string,{value:string;data:ResultRow['data'];source:string;message:string}>()
  const visiting=new Set<string>()
  function resolve(id:string):{value:string;data:ResultRow['data'];source:string;message:string} {
    if(cache.has(id))return cache.get(id)!
    const m=metrics.find(x=>x.id===id)
    if(!m)return {value:'',data:'MISSING',source:'依赖',message:`缺少依赖指标 ${id}`}
    let item:{value:string;data:ResultRow['data'];source:string;message:string}
    if(m.source==='DESIGN') item={value:design[id]||'',data:design[id]&&design[id]!=='—'?'VALID':'MISSING',source:'设计标准',message:'固定设计属性，仅参考'}
    else if(m.source==='CALCULATED') {
      if(!formulas[id])item={value:'',data:'UNCONFIGURED',source:'受控计算',message:formulaDescription(m)}
      else if(visiting.has(id)) item={value:'',data:'CALC_INVALID',source:'受控计算',message:'公式循环依赖'}
      else {
        visiting.add(id)
        try {
          const result=formulas[id]!.run((dependency,isDesign)=>{
            const d=isDesign?{value:design[dependency]||'',data:'VALID',message:''}:resolve(dependency)
            const n=numeric(d.value)
            if(d.data!=='VALID'||n===null||(isDesign&&n<=0))throw new Error(`依赖不可用：${dependency} ${isDesign?'应为正数设计参数':d.message}`)
            return n
          })
          if(!Number.isFinite(result))throw new Error('结果非有限数')
          item={value:String(Number(result.toFixed(4))),data:'VALID',source:'受控计算',message:formulaDescription(m)}
        }catch(e){item={value:'',data:'CALC_INVALID',source:'受控计算',message:String((e as Error).message)}}
        visiting.delete(id)
      }
    } else {
      const c=cells[id];const value=c?.value.trim()||''
      const invalid=!m.text&&(numeric(value)===null||(m.name==='pH'&&(numeric(value)!<0||numeric(value)!>14))||(numeric(value)!<0 && !/ORP|温度|^T$/.test(m.name)))
      const data=c?.state==='NA'?'NA':c?.state==='INVALID'?'INVALID':!value?'MISSING':invalid?'INVALID':'VALID'
      item={value,data,source:c?.source==='DEMO'?'示范填入':c?.source==='IMPORT'?'表格导入':'人工填报',message:c?.note||''}
    }
    cache.set(id,item);return item
  }
  return metrics.filter(m=>m.scopes.includes('diagnosis')).map(m=>{
    const actual=resolve(m.id), t=targets?.[m.id]
    const row:ResultRow={id:m.id,code:m.code,category:m.category,name:m.name,unit:m.unit,design:design[m.id]||'未维护',target:displayTarget(t),actual:actual.value,data:actual.data,state:'pending',deviation:null,difference:null,explanation:actual.message,source:actual.source,formula:formulaDescription(m),rule:'未匹配有效工况或未配置目标'}
    if(actual.data!=='VALID')return row
    if(m.source==='DESIGN'){row.state='reference';return row}
    if(!t||!t.value.trim()||t.value==='—')return row
    if(t.mode==='REFERENCE'){row.state='reference';row.rule='仅参考，不纳入正常/预警/告警计数';return row}
    const error=targetError(t);if(error){row.rule=error;return row}
    row.rule=`${modeLabels[t.mode]}；预警容差 ${t.warning}%，告警容差 ${t.alarm}%（项目待校核）；零目标按绝对偏差，任何非零偏差预警`
    if(t.mode==='TEXT'){row.state=actual.value===t.value?'normal':'warning';row.explanation=actual.value===t.value?'文本一致':'文本不一致，需核查；不自动等同“未检出”和“无”';return row}
    const n=numeric(actual.value); if(n===null){row.data='INVALID';return row}
    let base=numeric(t.value)??0
    if(t.mode==='RANGE'){const [low,high]=bounds(t.value)!;base=n<low?low:n>high?high:n}
    const diff=n-base;row.difference=diff;row.deviation=base===0?null:diff/Math.abs(base)*100
    const distance=t.mode==='UPPER'?Math.max(0,diff):t.mode==='LOWER'?Math.max(0,-diff):Math.abs(diff)
    const pct=base===0?null:distance/Math.abs(base)*100
    row.state=distance===0?'normal':pct===null?'warning':pct<=t.warning?'normal':pct<=t.alarm?'warning':'alarm'
    row.explanation=`${t.mode==='RANGE'&&distance===0?'范围内':distance===0?'满足目标':`相对控制基准差值 ${Number(diff.toFixed(4))} ${m.unit}`}。运行偏差提示，不代表法定达标判定。${actual.message}`
    return row
  })
}
