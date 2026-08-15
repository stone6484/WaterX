import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const outDir='/Users/fen/Documents/安全管理/safety-platform/outputs/real-data-kit';
const wb=Workbook.create();
const navy='#163A32', green='#256B57', pale='#EAF3EF', gold='#D89A35', gray='#66736F', light='#F7FAF8', border='#D9E5DF';

function title(sheet,text,subtitle,cols){
  sheet.showGridLines=false; sheet.mergeCells(`A1:${cols}1`); sheet.getRange('A1').values=[[text]];
  sheet.getRange('A1').format={fill:navy,font:{bold:true,color:'#FFFFFF',size:18},rowHeight:34,verticalAlignment:'center'};
  sheet.mergeCells(`A2:${cols}2`); sheet.getRange('A2').values=[[subtitle]];
  sheet.getRange('A2').format={fill:pale,font:{color:gray,size:10},wrapText:true,rowHeight:30,verticalAlignment:'center'};
}
function setup(name,subtitle,headers,widths,rows=[]){
  const s=wb.worksheets.add(name); const end=String.fromCharCode(64+headers.length); title(s,`安全生产管理平台｜${name}`,subtitle,end);
  s.getRange(`A4:${end}4`).values=[headers]; s.getRange(`A4:${end}4`).format={fill:green,font:{bold:true,color:'#FFFFFF'},horizontalAlignment:'center',verticalAlignment:'center',wrapText:true,rowHeight:28,borders:{preset:'inside',style:'thin',color:border}};
  if(rows.length)s.getRangeByIndexes(4,0,rows.length,headers.length).values=rows;
  const reserved=Math.max(rows.length,30); const body=s.getRangeByIndexes(4,0,reserved,headers.length); body.format={fill:'#FFFFFF',font:{color:'#20332D',size:10},verticalAlignment:'center',wrapText:true,borders:{preset:'inside',style:'thin',color:'#E7EEEA'}};
  widths.forEach((w,i)=>s.getRangeByIndexes(0,i,reserved+4,1).format.columnWidth=w);
  s.freezePanes.freezeRows(4); s.getRange(`A4:${end}${reserved+4}`).format.autofitRows();
  s.tables.add(`A4:${end}${reserved+4}`,true,`${name.replace(/[^A-Za-z0-9]/g,'')}Table`);
  return s;
}
const guide=wb.worksheets.add('填写说明'); guide.showGridLines=false; title(guide,'安全生产管理平台｜真实数据导入模板','黄色字段为业务必填项；编码在同一租户内必须唯一。请勿修改工作表名称和列标题。','F');
guide.getRange('A4:F4').values=[['步骤','负责人','操作','完成标准','是否必需','备注']];
guide.getRange('A5:F12').values=[
 ['1','系统管理员','填写厂区、组织、岗位','编码唯一，层级关系明确','是','先完成基础组织'],
 ['2','人事/综合管理','填写人员及人员任职','工号唯一，主岗位明确','是','人员状态使用下拉值'],
 ['3','安全经理','填写资格证书','证书号、有效期、提醒天数齐全','是','覆盖负责人、安全员及特种作业'],
 ['4','设备主管','填写设备物资','特种设备、附件、消防和应急物资均建档','是','备案号按实际填写'],
 ['5','安全经理','填写职业危害因素','区域、接触岗位、措施与检测周期齐全','是','按职业卫生评价资料填写'],
 ['6','安全经理/各部门','填写风险对象与危险源','危险源可关联到风险对象','是','评估值上线后在系统内复核'],
 ['7','系统管理员','校验后导入','无空白必填项、无重复编码','是','先在测试环境导入'],
 ['8','安全经理','现场复核','随机抽查并签字确认','是','复核后再切换生产数据']
];
guide.getRange('A4:F4').format={fill:green,font:{bold:true,color:'#FFFFFF'},horizontalAlignment:'center'}; guide.getRange('A5:F12').format={wrapText:true,borders:{preset:'inside',style:'thin',color:border}}; [10,16,25,30,12,28].forEach((w,i)=>guide.getRangeByIndexes(0,i,12,1).format.columnWidth=w); guide.freezePanes.freezeRows(4);

const sites=setup('厂区','*厂区编码、*厂区名称为必填；时区默认 Asia/Shanghai。',['*厂区编码','*厂区名称','地址','时区','状态'],[18,28,36,20,14],[['PLANT-001','第一污水处理厂','填写实际地址','Asia/Shanghai','ACTIVE']]);
const org=setup('组织','先录入上级组织；顶级组织的上级编码留空。',['*厂区编码','*组织编码','*组织名称','*组织类型','上级组织编码','排序号','状态'],[18,18,26,18,20,12,14],[['PLANT-001','DEPT-SAFETY','安全管理部','DEPARTMENT','',10,'ACTIVE'],['PLANT-001','TEAM-OPS-01','运行一班','TEAM','DEPT-OPS',20,'ACTIVE']]);
const positions=setup('岗位','岗位编码唯一；岗位类别用于后续责任和资质匹配。',['*岗位编码','*岗位名称','岗位类别','岗位说明','状态'],[18,24,20,42,14],[['POS-SAFETY','安全员','SAFETY','负责风险、检查、隐患和培训管理','ACTIVE']]);
const people=setup('人员','证件号码等敏感信息如无业务必要可不填写。',['*厂区编码','*工号','*姓名','手机','邮箱','入职日期','状态'],[18,18,20,18,28,16,14],[['PLANT-001','P0001','张三','13800000000','',new Date('2026-01-01'),'ACTIVE']]); people.getRange('F5:F34').setNumberFormat('yyyy-mm-dd');
const appoint=setup('人员任职','一个人员只允许一条当前主岗位记录。',['*工号','*组织编码','*岗位编码','是否主岗位','任职开始日期','任职结束日期'],[18,20,20,16,18,18],[['P0001','DEPT-SAFETY','POS-SAFETY','是',new Date('2026-01-01'),null]]); appoint.getRange('E5:F34').setNumberFormat('yyyy-mm-dd');
const cert=setup('资格证书','资格类别使用下拉选项；到期前按提醒天数生成预警。',['*工号','*资格类别','*证书名称','*证书编号','发证机构','发证日期','*有效期至','*提前提醒天数'],[18,22,28,22,28,16,16,18],[['P0001','SAFETY_OFFICER','安全生产管理人员培训合格证','AQ-001','实际发证机构',new Date('2026-01-01'),new Date('2029-01-01'),30]]); cert.getRange('F5:G34').setNumberFormat('yyyy-mm-dd');
const assets=setup('设备物资','特种设备需填写备案/登记号；消防与应急物资建议填写有效期。',['*厂区编码','*资产编号','*名称','*资产类型','分类','*位置','责任人','制造单位','型号规格','备案/登记号','*数量','*单位','投用日期','下次检验日期','使用有效期至','*提醒天数'],[18,18,26,20,18,24,18,24,20,22,12,12,16,18,18,16],[['PLANT-001','TS-001','起重设备','SPECIAL_EQUIPMENT','起重机械','污泥脱水机房','设备主管','','','','1','台',new Date('2025-01-01'),new Date('2026-12-31'),null,30]]); assets.getRange('M5:O34').setNumberFormat('yyyy-mm-dd');
const factors=setup('职业危害因素','依据职业病危害评价与检测资料填写。',['*厂区编码','*危害因素','*因素类型','*存在区域','*接触岗位','接触水平','职业接触限值','*管控措施','*检测周期','上次检测日期','下次检测日期'],[18,20,18,28,28,24,24,48,18,18,18],[['PLANT-001','硫化氢','CHEMICAL','提升泵房、污泥处理区','运行人员','符合限值','按现行标准执行','通风、检测、呼吸防护和有限空间制度','ANNUAL',new Date('2026-01-01'),new Date('2027-01-01')]]); factors.getRange('J5:K34').setNumberFormat('yyyy-mm-dd');
const riskObjects=setup('风险对象','风险对象可以是设备设施、作业活动或区域。',['*厂区编码','*风险对象编码','*风险对象名称','*对象类型','所在区域编码','状态'],[18,22,30,20,22,14],[['PLANT-001','RO-001','污水提升泵房有限空间作业','ACTIVITY','AREA-PUMP','ACTIVE']]);
const hazards=setup('危险源','首次导入后须在系统中使用 LS 或 LEC 复核评估并审批。',['*风险对象编码','*危险源编码','*危险因素','*可能后果','*事故类型','辨识依据','辨识日期','下次复评日期','工程措施','管理措施','培训措施','个体防护','应急措施'],[22,22,34,34,20,28,16,18,38,38,34,34,34],[['RO-001','HZ-001','硫化氢积聚、缺氧','中毒窒息','中毒和窒息','有限空间风险辨识',new Date('2026-01-01'),new Date('2027-01-01'),'机械通风、气体检测','作业票和监护制度','有限空间专项培训','呼吸防护用品','现场应急救援器材']]); hazards.getRange('G5:H34').setNumberFormat('yyyy-mm-dd');

const lists=wb.worksheets.add('下拉选项'); lists.showGridLines=false; lists.getRange('A1:H8').values=[
 ['状态','组织类型','资格类别','资产类型','职业因素类型','检测周期','风险对象类型','是否'],
 ['ACTIVE','PLANT','PRINCIPAL','SPECIAL_EQUIPMENT','CHEMICAL','ANNUAL','EQUIPMENT','是'],
 ['INACTIVE','DEPARTMENT','SAFETY_OFFICER','SAFETY_ACCESSORY','PHYSICAL','SEMI_ANNUAL','FACILITY','否'],
 ['', 'TEAM','SPECIAL_OPERATION','FIRE_EQUIPMENT','BIOLOGICAL','QUARTERLY','ACTIVITY',''],
 ['', '', 'SPECIAL_EQUIPMENT','EMERGENCY_SUPPLY','','MONTHLY','AREA',''],
 ['', '', '', '', '', '', 'OTHER',''],['','','','','','','',''],['','','','','','','','']
]; lists.getRange('A1:H1').format={fill:navy,font:{bold:true,color:'#FFFFFF'}}; lists.getRange('A1:H8').format.columnWidth=22;

sites.getRange('E5:E34').dataValidation={rule:{type:'list',formula1:"'下拉选项'!$A$2:$A$3"}};
org.getRange('D5:D34').dataValidation={rule:{type:'list',formula1:"'下拉选项'!$B$2:$B$4"}}; org.getRange('G5:G34').dataValidation={rule:{type:'list',formula1:"'下拉选项'!$A$2:$A$3"}};
positions.getRange('E5:E34').dataValidation={rule:{type:'list',formula1:"'下拉选项'!$A$2:$A$3"}}; people.getRange('G5:G34').dataValidation={rule:{type:'list',formula1:"'下拉选项'!$A$2:$A$3"}};
appoint.getRange('D5:D34').dataValidation={rule:{type:'list',formula1:"'下拉选项'!$H$2:$H$3"}}; cert.getRange('B5:B34').dataValidation={rule:{type:'list',formula1:"'下拉选项'!$C$2:$C$5"}};
assets.getRange('D5:D34').dataValidation={rule:{type:'list',formula1:"'下拉选项'!$D$2:$D$5"}}; factors.getRange('C5:C34').dataValidation={rule:{type:'list',formula1:"'下拉选项'!$E$2:$E$4"}}; factors.getRange('I5:I34').dataValidation={rule:{type:'list',formula1:"'下拉选项'!$F$2:$F$5"}}; riskObjects.getRange('D5:D34').dataValidation={rule:{type:'list',formula1:"'下拉选项'!$G$2:$G$6"}};

for(const name of ['厂区','组织','岗位','人员','人员任职','资格证书','设备物资','职业危害因素','风险对象','危险源']){
  const s=wb.worksheets.getItem(name); const used=s.getUsedRange();
  const header=s.getRange(`A4:${String.fromCharCode(64+used.columnCount)}4`); header.conditionalFormats.add('containsText',{text:'*',format:{fill:gold,font:{bold:true,color:'#FFFFFF'}}});
}
await fs.mkdir(outDir,{recursive:true});
const file=await SpreadsheetFile.exportXlsx(wb); await file.save(`${outDir}/安全生产管理平台-真实数据导入模板.xlsx`);
for(const sheetName of ['填写说明','厂区','组织','岗位','人员','人员任职','资格证书','设备物资','职业危害因素','风险对象','危险源','下拉选项']){
  const img=await wb.render({sheetName,autoCrop:'all',scale:1,format:'png'}); await fs.writeFile(`${outDir}/${sheetName}.png`,new Uint8Array(await img.arrayBuffer()));
}
console.log((await wb.inspect({kind:'sheet',include:'id,name',maxChars:4000})).ndjson);
console.log((await wb.inspect({kind:'table',sheetId:'填写说明',range:'A1:F12',include:'values,formulas',tableMaxRows:14,tableMaxCols:8,maxChars:6000})).ndjson);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',options:{useRegex:true,maxResults:100},summary:'formula errors'})).ndjson);
