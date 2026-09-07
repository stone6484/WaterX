import type { Draft, Fact, Metric } from './types'
import { combine, derive, finish, number, result, structuralIssues, threshold } from './calculation'
export function solidFact(f: Fact, d: Draft): Metric {
  const base = (n: number | null, formula: string, status = f.state, note = '') => result(f.id, f.name, 't干固体', n, [f.id], formula, status, note)
  if (f.state === 'NA') return base(null, '不适用不参与汇总', f.note.trim() ? 'NA' : 'INVALID')
  if (f.state === 'MISSING' || f.state === 'INVALID') return base(null, '', f.state)
  if (f.date !== d.date || !f.source.trim() || !f.name.trim()) return base(null, '', 'INVALID', '名称、日期或来源待核验')
  const v = number(f.values.value), c = number(f.values.concentration), moisture = number(f.values.moisture)
  if (f.role === 'STOCK') {
    const a = number(f.values.start), b = number(f.values.end)
    return base(a !== null && b !== null && a >= 0 && b >= 0 && f.unit === 't干固体' ? b - a : null, '期末干固体库存−期初；各库存换算依据保留在来源', a !== null && a < 0 || b !== null && b < 0 || f.unit !== 't干固体' ? 'INVALID' : f.state)
  }
  if (f.role === 'TRANSFORM') return base(f.unit === 't干固体' ? v : null, '所声明固体口径下净生成/消耗；未知不能填0', f.unit === 't干固体' ? f.state : 'INVALID')
  if (v !== null && v < 0) return base(null, '', 'INVALID', '流量/质量不得为负')
  if (f.method === 'LIQUID') {
    if (!['mg/L', 'kg/m³'].includes(f.unit) || c !== null && c < 0) return base(null, '', 'INVALID', '浓度单位或数值异常')
    return base(v !== null && c !== null ? v * c / (f.unit === 'mg/L' ? 1e6 : 1000) : null, `体积m³×${f.unit}浓度÷${f.unit === 'mg/L' ? '10⁶' : '1000'}；先逐段相乘再求和`)
  }
  if (f.method === 'WET') {
    if (f.unit !== 't湿泥' || moisture !== null && (moisture < 0 || moisture > 100)) return base(null, '', 'INVALID', '湿质量单位或含水率不在0—100%')
    return base(v !== null && moisture !== null ? v * (1 - moisture / 100) : null, '湿质量t×(1−含水率%/100)')
  }
  return base(f.unit === 't干固体' ? v : null, '独立计量/已核验换算的干固体量', f.unit === 't干固体' ? f.state : 'INVALID')
}
export function sludgeAnalysis(d: Draft) {
  const facts = d.facts.map(f => solidFact(f, d)), group = (role: string) => facts.filter(m => d.facts.some(f => f.id === m.id && f.selected && f.role === role))
  const selected = d.facts.filter(f => f.selected && ['IN', 'ADDED', 'OUT', 'RETURN'].includes(f.role) && f.state !== 'NA')
  const issues = structuralIssues(d.facts, selected)
  const input = combine('SB04', '边界输入干固体', 't干固体', [...group('IN'), ...group('ADDED')])
  // Absence of an entire required role is not proof that it is zero.
  if (!group('IN').length || !group('ADDED').length) { input.value = null; input.status = 'MISSING'; input.note = '来泥及外加贡献都须登记；确认无外加贡献可登记不适用' }
  const shipped = combine('SB09', '外运干固体', 't干固体', group('OUT')), returns = combine('SB-RETURN', '返流水固体', 't干固体', group('RETURN'))
  const output = derive('SB05', '边界输出干固体', 't干固体', [shipped, returns], '外运及其他外出＋返回水线固体', ([o, r]) => o! + r!)
  if (issues.length) for (const m of [input, output]) { m.value = null; m.status = 'INVALID'; m.note = issues.join('；') }
  const stock = combine('SB03', '干固体库存变化', 't干固体', group('STOCK'))
  const transform = combine('SB-G', '净生成 / 消耗', 't干固体', group('TRANSFORM'))
  const residual = derive('SB06', '未解释固体差额', 't干固体', [input, output, stock, transform], '输入＋净转化−输出−库存增加', ([i, o, s, g]) => i! + g! - o! - s!)
  if (!d.complete || !d.basis.trim() || !d.checks.solids || !d.checks.independent) { residual.value = null; residual.status = 'MISSING'; residual.note = '须确认完整边界、固体检测口径可比及独立输出/库存证据；同源推算不能自证闭合' }
  const ratio = derive('SB07', '固体差额相对量', '%', [residual, input], '差额/输入×100', ([r, i]) => i! > 0 ? r! / i! * 100 : null)
  const net = derive('SB10', '所声明边界净积存速率', 't干固体/d', [input, output, transform], '同日输入−输出＋净转化；与独立库存变化分别核对', ([i, o, g]) => d.complete && d.checks.solids ? i! - o! + g! : null)
  const wetTrucks = d.facts.filter(f => f.selected && f.role === 'OUT' && f.state !== 'NA')
  const wet = combine('SB-WET', '外运湿质量', 't湿泥', wetTrucks.map(f => result(`${f.id}-wet`, f.name, 't湿泥', f.method === 'WET' && f.unit === 't湿泥' && solidFact(f, d).value !== null ? number(f.values.value) : null, [f.id], '逐车独立称重', f.state)))
  const moisture = derive('SB09-W', '外运加权含水率', '%', [shipped, wet], '(1−Σ各车干固体/Σ湿质量)×100', ([s, w]) => w! > 0 ? (1 - s! / w!) * 100 : null)
  const param = (key: string, name: string, unit: string) => { const v = number(d.parameters[key]); return result(`SB-${key}`, name, unit, v !== null && v >= 0 ? v : null, [], '经核验参数；依据：' + (d.parameters.capacitySource || '待提供'), v !== null && v < 0 ? 'INVALID' : 'VALID') }
  const rate = param('rate', '当前确认进料产率', 't干固体/h'), hours = param('hours', '可用小时', 'h/d'), demand = param('demand', '待处理进料', 't干固体/d')
  if (!d.checks.capacity || !d.parameters.capacitySource?.trim() || (hours.value !== null && hours.value > 24)) { rate.value = null; rate.status = 'MISSING'; rate.note = '同进料口径的当前产率、可用小时及共享限制须确认；小时不得超过24' }
  const batch = param('batchDS', '每完整批次进料干固体', 't干固体/批'), cycle = param('cycle', '完整批次周期', 'h/批')
  const capacity = d.checks.batch ? derive('SB11', '可用脱水能力（批次）', 't干固体/d', [batch, hours, cycle], '每批进料量×向下取整(可用小时/完整周期)', ([b, h, c]) => d.checks.capacity && !!d.parameters.capacitySource?.trim() && h! <= 24 && c! > 0 ? b! * Math.floor(h! / c!) : null) : derive('SB11', '可用脱水能力', 't干固体/d', [rate, hours], '当前经核验产率×可用小时', ([r, h]) => r! * h!)
  const gap = derive('SB11-GAP', '处理能力缺口', 't干固体/d', [demand, capacity], '待处理量−可用能力（负数为余量）', ([q, c]) => q! - c!)
  const remaining = param('remaining', '同形态可用库存余量', 't干固体'), accumulation = param('accumulation', '已核验正净积存速率', 't干固体/d')
  const days = derive('SB12', '达到储存边界时间（情景）', 'd', [remaining, accumulation], '同形态余量/已核验正积存速率，非安全保证', ([r, a]) => d.checks.stable && a! > 0 ? r! / a! : null); if (days.value !== null) days.status = 'ESTIMATED'
  const returnLoads = d.facts.filter(f => f.selected && f.role === 'RETURN').map(f => {
    const v = number(f.values.value), c = number(f.values.pollutant)
    return result(`${f.id}-N`, `${f.name}氨氮返回负荷`, 'kg/d', f.method === 'LIQUID' && f.date === d.date && !!f.source.trim() && (f.state === 'VALID' || f.state === 'ESTIMATED') && v !== null && v >= 0 && c !== null && c >= 0 ? v * c / 1000 : null, [f.id], '返流水m³×同日氨氮mg/L÷1000；不依赖固体浓度', f.state)
  })
  const processed = param('processedDS', '本设备实际处理进料干固体', 't干固体'), energy = param('energy', '本设备同期电量', 'kWh'), drug = param('actualDrug', '同药种实际商品投加', 'kg商品')
  const specificEnergy = derive('SB13-E', '同设备进料单位电耗', 'kWh/t干固体', [energy, processed], '本设备电量/本设备实际处理进料DS', ([e, s]) => d.checks.resources && !!d.parameters.resourceSource?.trim() && s! > 0 ? e! / s! : null)
  const specificDrug = derive('SB13-D', '同设备进料单位药耗', 'kg商品/t干固体', [drug, processed], '已声明单一药种实际投加/本设备实际处理进料DS', ([m, s]) => d.checks.resources && !!d.parameters.resourceSource?.trim() && s! > 0 ? m! / s! : null)
  const cost = combine('SB14', '所列污泥运行成本', '元', [param('electricityFee', '所列电费', '元'), param('drugFee', '所列药费', '元'), param('transportFee', '运输处置合计费用', '元')])
  cost.formula = '所列互斥电费＋药费＋运输处置费；合价不重复加分价'
  if (!d.checks.costs || !d.parameters.resourceSource?.trim()) { cost.value = null; cost.status = 'MISSING'; cost.note = '实际费用凭据、计费基础和互斥关系待核验；不是完整经营成本' }
  if (gap.value !== null && gap.value > 0) issues.push('已确认进料口径的处理能力不足，核验在线组合和外运衔接；不会自动延长工时')
  return finish([input, shipped, stock, residual, ratio, output, transform, wet, moisture, net, capacity, gap, days, specificEnergy, specificDrug, cost, ...returnLoads, ...facts], [...issues, ...threshold(d, residual, '绝对固体差额'), '仅污泥处理线物料账，不预测生化产泥；库存和净转化未知时不给完整平衡。'])
}
