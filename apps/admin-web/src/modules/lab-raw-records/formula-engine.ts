import type { LabCalculatedResult, LabQcCheck, LabQcStatus, LabRawRecord, LabTemplate } from './types'

const n=(record:LabRawRecord,key:string)=>{const value=Number(record.observations[key]);return Number.isFinite(value)?value:NaN}
const safe=(value:number)=>Number.isFinite(value)?value:null

export function calculateLabResults(record:LabRawRecord,template:LabTemplate):LabCalculatedResult[]{
  const o=(key:string)=>n(record,key)
  const c:Record<string,number|null>={}
  switch(template.code){
    case 'Y01':c.ph=safe((o('reading1')+o('reading2'))/2);break
    case 'Y02':c.bod5=safe(((o('d1')-o('d2'))-o('seedFactor')*(o('b1')-o('b2')))/o('sampleRatio'));break
    case 'Y03':c.cod=safe(o('titrantConcentration')*(o('blankVolume')-o('sampleTitration'))*8000*o('dilution')/o('sampleVolume'));break
    case 'Y04':c.ss=safe((o('loaded2')-o('tare2'))*1_000_000/o('sampleVolume'));break
    case 'Y05':case 'Y06':case 'Y12':{
      const mass=(o('sampleAbsorbance')-o('blankAbsorbance')-o('curveIntercept'))/o('curveSlope');c.mass=safe(mass);c.concentration=safe(mass*o('dilution')/o('sampleVolume'));break
    }
    case 'Y07':case 'Y08':{
      const corrected=o('a220')-2*o('a275');const mass=(corrected-o('curveIntercept'))/o('curveSlope');c.correctedAbsorbance=safe(corrected);c.mass=safe(mass);c.concentration=safe(mass*o('dilution')/o('sampleVolume'));break
    }
    case 'Y09':c.fc=safe(o('colonyCount')*1000*o('dilution')/o('sampleVolume'));break
    case 'Y10':{
      const mlss=(o('dryMass')-o('tareMass'))*1_000_000/o('sampleVolume');const mlvss=(o('dryMass')-o('ignitedMass'))*1_000_000/o('sampleVolume');
      c.mlss=safe(mlss);c.mlvss=safe(mlvss);c.svI=safe(o('sv30')*10_000/mlss);c.ratio=safe(mlvss/mlss*100);break
    }
    case 'Y11':{
      const dry=o('dryMass')-o('tareMass');c.moisture=safe((o('wetMass')-o('dryMass'))/(o('wetMass')-o('tareMass'))*100);c.organic=safe((o('dryMass')-o('ashMass'))/dry*100);break
    }
    case 'Y13':c.alkalinity=safe((o('phenolphthaleinVolume')+o('methylOrangeVolume'))*o('acidConcentration')*50_000*o('dilution')/o('sampleVolume'));break
    case 'Y14':c.chloride=safe((o('sampleTitration')-o('blankVolume'))*o('silverConcentration')*35_450*o('dilution')/o('sampleVolume'));break
    case 'Y15':c.totalSalts=safe((o('dryMass')-o('tareMass'))*1_000_000*o('dilution')/o('sampleVolume'));break
    case 'Y16':{
      c.alumina=safe((((o('blankVolume')-o('sampleTitration'))*o('zincConcentration')*101.96/2)*0.001)/(o('sampleMass')*o('aliquotVolume')/o('flaskVolume'))*100);
      c.densityResult=safe(o('density'));break
    }
    case 'Y17':c.availableChlorine=safe(o('thioConcentration')*o('sampleTitration')*0.03545/(o('sampleMass')*10/500)*100);c.densityResult=safe(o('density'));break
    case 'Y18':c.content=record.observations.productType==='冰醋酸'?safe(o('alkaliConcentration')*o('sampleTitration')*60.05/(o('sampleMass')*1000)*100):null;c.codEquivalentResult=safe(o('codEquivalent'));c.densityResult=safe(o('density'));break
  }
  return template.results.map(result=>{const value=c[result.key]??null;return{...result,value,display:value===null?'待计算':value.toFixed(result.decimals)}})
}

export function evaluateLabQc(record:LabRawRecord,template:LabTemplate,results:LabCalculatedResult[]):{status:LabQcStatus;checks:LabQcCheck[]}{
  const checks:LabQcCheck[]=[]
  const missing=template.fields.filter(field=>field.required&&!String(record.observations[field.key]??'').trim())
  checks.push({id:'required',label:'必填观测值完整性',status:missing.length?'待完成':'通过',message:missing.length?`缺少：${missing.map(item=>item.label).join('、')}`:'所有必填一手观测值已填写'})
  const invalid=results.filter(result=>result.value===null||result.value<0)
  checks.push({id:'formula',label:'受控公式有效性',status:invalid.length?'阻断':'通过',message:invalid.length?`无法形成有效结果：${invalid.map(item=>item.label).join('、')}`:`${template.formulaVersion} 计算有效`})
  const obs=(key:string)=>Number(record.observations[key])
  if(template.code==='Y01')checks.push({id:'parallel',label:'pH平行示值差',status:Math.abs(obs('reading1')-obs('reading2'))<=0.10?'通过':'警告',message:`当前差值 ${Math.abs(obs('reading1')-obs('reading2')).toFixed(2)}，演示控制限 0.10`})
  if(template.code==='Y02')checks.push({id:'bod-residual',label:'培养后剩余溶解氧',status:obs('d2')>=1?'通过':'警告',message:`培养后 DO ${obs('d2')} mg/L；控制限为演示参数，待项目确认`})
  if(template.code==='Y04')checks.push({id:'constant-weight',label:'恒重差检查',status:Math.max(Math.abs(obs('tare1')-obs('tare2')),Math.abs(obs('loaded1')-obs('loaded2')))<=0.0005?'通过':'警告',message:'两次称量最大差应满足项目恒重控制要求（当前演示限值 0.0005 g）'})
  if(template.code==='Y09')checks.push({id:'colony-range',label:'滤膜可计数范围',status:obs('colonyCount')<=80?'通过':'警告',message:'菌落数过高时应调整稀释倍数并重新培养'})
  if(template.methodState!=='现行方法')checks.push({id:'method-state',label:'方法适用性状态',status:template.methodState==='待确认'?'警告':'通过',message:template.scopeNote||'使用受控项目方法，不显示为正式现行标准'})
  let status:LabQcStatus='通过'
  if(checks.some(item=>item.status==='阻断'))status='阻断';else if(checks.some(item=>item.status==='待完成'))status='待完成';else if(checks.some(item=>item.status==='警告'))status='警告'
  return{status,checks}
}
