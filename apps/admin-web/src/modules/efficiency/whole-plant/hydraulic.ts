import type { Draft, Metric } from './types'
import { derive, finish, number, result } from './calculation'
export function hydraulicAnalysis(d: Draft) {
  const metrics: Metric[] = [], issues: string[] = []
  for (const f of d.facts) {
    const up = number(f.values.start), down = number(f.values.end), flow = number(f.values.flow)
    const valid = f.selected && f.state !== 'NA' && f.date === d.date && !!f.source.trim() && !!f.name.trim() && f.unit === 'm' && (f.state === 'VALID' || f.state === 'ESTIMATED')
    const qualified = d.checks.datum && d.checks.simultaneous && !!d.parameters.datum?.trim() && !!f.values.time?.trim() && f.method === 'FREE' && d.checks.velocity && flow !== null && flow > 0
    const head = result(f.id, f.name + '水头差参考', 'm', valid && qualified && up !== null && down !== null ? up - down : null, [f.id], '同基准同期自由水面上游−下游；两端大气压且速度水头差可忽略', f.state === 'NA' ? f.note.trim() ? 'NA' : 'INVALID' : valid && qualified ? f.state : 'MISSING', '不把池底/堰顶/压力测点标高当水位；跨泵/压力段本版待专项核验')
    const design = number(f.values.design), cap = number(f.values.maxLevel)
    const actual = result(`${f.id}-UP`, f.name + '上游水位', 'm', valid ? up : null, [f.id], '原测点读数，不因水头比较条件不足隐藏')
    const reference = result(`${f.id}-DES`, '同基准设计参考', 'm', d.checks.datum ? design : null, [f.id], '设计资料来源见点位凭据')
    const constraint = result(`${f.id}-MAX`, '已确认上游允许最高水位', 'm', d.checks.level ? cap : null, [f.id], '项目适用约束；未经确认不作为安全判定')
    const deviation = derive(`${f.id}-DEV`, f.name + '对设计参考差', 'm', [actual, reference], '实际水位−设计参考；不是目标偏差', ([a, r]) => a! - r!)
    const margin = derive(`${f.id}-MARGIN`, f.name + '上游水位裕量', 'm', [constraint, actual], '已确认最高水位−实际水位', ([m, a]) => m! - a!)
    if (margin.value !== null && margin.value < 0) issues.push(`${f.name}超过已确认水位限制，请现场核验；软件不直接控制设备`)
    metrics.push(head, deviation, margin)
  }
  const param = (key: string, name: string, unit: string) => { const v = number(d.parameters[key]); return result(`HY-${key}`, name, unit, v !== null && v >= 0 ? v : null, [], '已核验参数；来源：' + (d.parameters.energySource || '待提供')) }
  const volume = param('volume', '试算过水体积', 'm³'), dh = param('dh', '已确认可减少扬程', 'm'), rho = param('rho', '适用水密度', 'kg/m³'), g = param('g', '适用重力加速度', 'm/s²'), efficiency = param('efficiency', '适用总效率（0—1）', '比例')
  const potential = derive('HY-POTENTIAL', '水力能变化试算', 'kWh', [volume, dh, rho, g], 'ρ×g×V×ΔH/3600000；不得将全部跌水默认可消除', ([v, h, r, g]) => d.checks.reducible && d.parameters.energySource?.trim() && r! > 0 && g! > 0 ? r! * g! * v! * h! / 3600000 : null)
  const electric = derive('HY-ELECTRIC', '电量变化试算', 'kWh', [potential, efficiency], '水力能变化/适用总效率；非已实现节电', ([h, e]) => e! > 0 && e! <= 1 ? h! / e! : null)
  if (potential.value !== null) potential.status = 'ESTIMATED'; if (electric.value !== null) electric.status = 'ESTIMATED'
  return finish([potential, electric, ...metrics], [...issues, '仅同基准自由水面条件下计算水头差参考；阻力变化、堵塞、尾水顶托均需现场证据，跌水不全等于可回收能量。'])
}
