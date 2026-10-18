import type { Cell } from './types'

export const RESULT_CATEGORIES = ['进水水质','进水特征','出水水质','处理效能','污泥性状','沿程分析']
export const CONTROL_CATEGORIES = ['水量控制','曝气控制','回流控制','排泥控制','加药控制','搅拌控制']

// Keep page-specific scope/selection with its owner; only group the supplied catalog.
export function groupMetricBoards<T extends {category:string}>(metrics:T[], left:string, right:string) {
  return [false,true].map(process=>{
    const rows=metrics.filter(m=>CONTROL_CATEGORIES.includes(m.category)===process)
    const present=[...new Set(rows.map(m=>m.category))]
    const order=process?CONTROL_CATEGORIES:RESULT_CATEGORIES
    const categories=[...order.filter(c=>present.includes(c)),...present.filter(c=>!order.includes(c))]
    const selected=process?right:left
    const active=categories.includes(selected)?selected:categories[0]
    return {process,categories,active,rows:rows.filter(m=>m.category===active)}
  })
}

// Validate the complete paste before emitting draft changes. Never cross a category.
export function entryPasteChanges(text:string, metrics:{id:string;name:string;code:string}[], startId:string, cells:Record<string,Cell>) {
  const start=metrics.findIndex(m=>m.id===startId)
  if(start<0)throw new Error('当前指标不在本分类中，请重新选择填报单元格。')
  const lines=text.replace(/\r\n?/g,'\n').replace(/\n$/,'').split('\n').map(line=>line.split('\t'))
  const hasHeader=lines[0]?.[0]?.trim()==='指标'&&lines[0]?.[1]?.trim()==='实际值'
  if(hasHeader)lines.shift()
  if(!lines.length)throw new Error('剪贴板没有可填报的数据。')
  let values:string[]
  const namedRows=lines.every(row=>row.length===2)&&[metrics[start]!.name,metrics[start]!.code].includes(lines[0]![0]!.trim())
  if(hasHeader||namedRows){
    if(!lines.every(row=>row.length===2))throw new Error('带指标名称的粘贴内容必须有“指标、实际值”两列，未写入任何内容。')
    values=lines.map((row,index)=>{
      const metric=metrics[start+index],label=row[0]!.trim()
      if(!metric||![metric.name,metric.code].includes(label))throw new Error('粘贴的指标顺序与当前分类不一致，请复制实际值一列，或按当前指标顺序粘贴。')
      return row[1]!
    })
  }else if(lines.length===1)values=lines[0]!
  else if(lines.every(row=>row.length===1))values=lines.map(row=>row[0]!)
  else throw new Error('粘贴的指标顺序不一致，请复制实际值一行、一列，或按当前顺序复制“指标、实际值”两列。')
  if(start+values.length>metrics.length)throw new Error('粘贴数量超出当前分类的剩余指标，未写入任何内容。')
  return values.map((value,index)=>{
    const metric=metrics[start+index]!,current=cells[metric.id]||{value:'',state:'VALID',source:'MANUAL',note:''}
    if(current.state==='NA')throw new Error(`${metric.name}已标为不适用，请先核对数据状态；本次粘贴未写入。`)
    if(/^\s*=/.test(value))throw new Error(`${metric.name}包含表格公式，请先在 Excel 中复制为实际数值；本次粘贴未写入。`)
    return {id:metric.id,cell:{...current,value,source:'IMPORT' as const}}
  })
}
