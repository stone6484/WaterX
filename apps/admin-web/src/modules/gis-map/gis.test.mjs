import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {CENTER,FEATURE_COUNTS,featureCollections,items,monitorsList} from './data.js'
import {historyFor,metricCatalog,metricKeysFor,qualityNames,readMetric,signalQualityFor} from './signals.js'
import {filterEntities,geometryIntersectsBounds,geometryIntersectsCircle,selectInBounds,selectInCircle,circlePolygon,distanceKm,pathDistanceKm,polygonAreaKm2} from './gis-model.js'
import {contextKey,getView,saveView,restoreView} from './view-state.js'
import {boundaryBounds,inCity,outsideCityMask} from './city-boundary.js'

test('圈选第二次点击完成且球面圆半径正确',()=>{
 const page=fs.readFileSync(new URL('./GisMapPage.vue',import.meta.url),'utf8')
 assert.ok(page.includes('else finishCircle(circleCenter.value,p)'))
 const ring=circlePolygon(CENTER,3)
 assert.equal(ring.length,65)
 assert.deepEqual(ring[0],ring.at(-1))
 for(const point of ring)assert.ok(Math.abs(distanceKm(CENTER,point)-3)<1e-8)
})

test('框选不命中共线但不相交的远处管段',()=>{
 assert.equal(geometryIntersectsBounds({type:'LineString',coordinates:[[0,0],[1,0]]},[2,0,3,1]),false)
 assert.equal(geometryIntersectsBounds({type:'LineString',coordinates:[[0,0],[3,0]]},[2,0,3,1]),true)
})

test('杭州市边界覆盖临安、建德、桐庐、淳安且排除相邻市',()=>{
 const boundary=JSON.parse(fs.readFileSync(new URL('./hangzhou-boundary.json',import.meta.url),'utf8'))
 assert.equal(boundary.properties.adcode,330100)
 assert.equal(boundary.geometry.type,'MultiPolygon')
 for(const point of [[120.15,30.28],[119.72,30.23],[119.28,29.47],[119.69,29.79],[119.04,29.61]])assert.equal(inCity(point,boundary),true)
 for(const point of [[120.58,30.00],[120.09,30.89],[119.65,29.08],[121.55,29.87]])assert.equal(inCity(point,boundary),false)
 assert.ok(items.every(item=>inCity(item.coords,boundary)))
 const bounds=boundaryBounds(boundary)
 assert.ok(bounds[0][0]<119&&bounds[1][0]>120)
 const mask=outsideCityMask(boundary)
 assert.equal(mask.features[0].geometry.coordinates.length,2)
 assert.deepEqual(mask.features[0].geometry.coordinates[1],boundary.geometry.coordinates[0][0])
})

test('地图工具收进信号质量之后的下拉框，不再占用地图按钮排',()=>{
 const page=fs.readFileSync(new URL('./GisMapPage.vue',import.meta.url),'utf8')
 const quality=page.indexOf('<label>信号质量')
 const tools=page.indexOf('<label>地图工具')
 const extent=page.indexOf('<label class="extent-check"')
 assert.ok(quality<tools&&tools<extent)
 assert.equal(page.includes('class="measure-tools"'),false)
 for(const value of ['none','box','circle','distance','area','clear'])assert.ok(page.includes('value="'+value+'"'))
 assert.ok(page.includes('@change="chooseMapTool"'))
})

test('GIS统一工具栏取消重复标题和底图切换，合并复位并统一全屏',()=>{
 const page=fs.readFileSync(new URL('./GisMapPage.vue',import.meta.url),'utf8')
 const toolbar=page.slice(page.indexOf('<header class="gis-toolbar">'),page.indexOf('</header>'))
 assert.equal(toolbar.includes('<h1>'),false)
 assert.equal(toolbar.includes('gis-filterbar'),false)
 assert.equal(toolbar.includes('setBaseMode'),false)
 assert.ok(toolbar.includes('class="toolbar-filters"'))
 assert.ok(toolbar.includes('@click="toggleMapExtent"'))
 assert.ok(toolbar.includes("showFullCity?'回到中心':'复位全图'"))
 assert.ok(page.includes('if(showFullCity.value)returnHome();else fitAll()'))
 assert.equal(toolbar.includes('<label>片区'),false)
 assert.equal(page.includes('class="map-actions"'),false)
 assert.equal(page.includes('class="result-drawer"'),false)
 assert.ok(page.includes('class="twin-name-link"'))
 assert.ok(page.includes('<WxTabs class="detail-tabs"'))
 assert.ok(toolbar.includes('class="fullscreen-action wx-fullscreen-action"'))
 assert.equal(toolbar.includes('@click="returnHome"'),false)
})

test('展示名称去掉示例但数据仍保持演示标记和稳定编号',()=>{
 assert.equal(items.some(x=>x.name.includes('示例')),false)
 assert.equal(items.every(x=>x.properties.demo===true),true)
 assert.equal(items.find(x=>x.id==='WWTP-01').name,'青山湖中心水厂')
})
test('泵站周期输送场景的关键读数仍为有限数值，零值保持为零',()=>{
 const pump=items.find(x=>x.id==='PS-001').feature
 for(const tick of [0,1,6,12])assert.equal(Number.isFinite(readMetric(pump,'flow',tick,'pump-cycle').value),true)
 assert.equal(readMetric(items.find(x=>x.id==='PS-006').feature,'flow',6,'pump-cycle').value,0)
})

test('示例资产数量符合4厂18泵6闸60管80节点30测点的固定口径',()=>{
 assert.deepEqual(FEATURE_COUNTS,{plants:4,pumps:18,gates:6,pipes:60,nodes:80,monitors:30,districts:4})
 assert.equal(new Set(items.map(x=>x.id)).size,items.length)
 const nodeIds=new Set(items.filter(x=>x.type==='node').map(x=>x.id))
 assert.ok(items.filter(x=>x.type==='pipe').every(x=>nodeIds.has(x.properties.fromNodeId)&&nodeIds.has(x.properties.toNodeId)))
 assert.equal(monitorsList.filter(x=>x.properties.assetType==='pipe').length,2)
 assert.ok(monitorsList.every(x=>items.some(y=>y.id===x.properties.assetId)))
 assert.ok(items.filter(x=>x.type==='gate').every(g=>!items.some(p=>p.type==='pipe'&&(p.properties.fromNodeId===g.id||p.properties.toNodeId===g.id))))
})

test('所有空间示例围绕近似中心且设施连接使用稳定ID',()=>{
 assert.ok(CENTER[0]>119.5&&CENTER[0]<120&&CENTER[1]>30&&CENTER[1]<30.5)
 for(const collection of Object.values(featureCollections))for(const f of collection.features)assert.ok(f.id&&f.properties.id===f.id)
 assert.ok(items.filter(x=>x.type==='pipe').every(x=>x.feature.geometry.type==='LineString'&&x.feature.geometry.coordinates.length>=2))
})

test('时间序列按同一模拟时刻生成，缺测保留空洞而不是补零',()=>{
 const pump=items.find(x=>x.id==='PS-018'),monitor=monitorsList.find(x=>x.properties.assetId==='PS-018')
 assert.equal(historyFor(monitor.feature,'velocity',1,0).length,13)
 assert.equal(historyFor(monitor.feature,'flow',6,0).length,37)
 assert.equal(historyFor(monitor.feature,'flow',24,0).length,49)
 assert.equal(signalQualityFor(monitor.feature),'interrupted')
 assert.ok(historyFor(monitor.feature,'velocity',24,0).some(x=>x.value===null))
 assert.equal(readMetric(pump.feature,'flow',4).value,readMetric(pump.feature,'flow',4).value)
})

test('正常、超时、中断、未配置和真实数值零五种状态可区分',()=>{
 const stale=monitorsList.find(x=>x.properties.assetId==='PS-002'),offline=monitorsList.find(x=>x.properties.assetId==='PS-018'),missing=monitorsList.find(x=>x.properties.assetId==='WWTP-03'),zero=monitorsList.find(x=>x.properties.assetId==='PS-006'),normal=monitorsList.find(x=>x.properties.assetId==='WWTP-01')
 assert.equal(readMetric(normal.feature,'flow').quality,'normal')
 assert.equal(readMetric(stale.feature,'liquidLevel').quality,'stale')
 assert.equal(readMetric(offline.feature,'velocity').quality,'interrupted')
 assert.equal(readMetric(missing.feature,'flow').quality,'unconfigured')
 assert.equal(readMetric(zero.feature,'flow').value,0)
 assert.equal(readMetric(zero.feature,'flow').quality,'zero')
 assert.equal(signalQualityFor(zero.feature),'zero')
 assert.deepEqual(Object.keys(qualityNames).sort(),['interrupted','normal','stale','unconfigured','zero'])
})

test('同图对比候选必须具备同一指标、单位与测量基准',()=>{
 const candidates=monitorsList.filter(x=>metricKeysFor(x.feature).includes('waterDepth'))
 assert.ok(candidates.length>0)
 assert.equal(metricCatalog.waterDepth.unit,'m')
 assert.equal(metricCatalog.waterDepth.basis,'相对断面底部水深')
 assert.ok(candidates.every(x=>metricCatalog.waterDepth.unit==='m'&&metricCatalog.waterDepth.basis==='相对断面底部水深'))
 assert.notEqual(metricCatalog.liquidLevel.basis,metricCatalog.waterDepth.basis)
})

test('名称编号、类别、片区、维护归属、状态和当前视野筛选组合正确',()=>{
 assert.equal(filterEntities({query:'PS-001'}).length,1)
 assert.equal(filterEntities({type:'pump'}).length,18)
 assert.equal(filterEntities({district:'district-west'}).every(x=>x.properties.districtId==='district-west'),true)
 assert.equal(filterEntities({maintainer:'水系管理组'}).length,12)
 assert.ok(filterEntities({quality:'stale'}).some(x=>x.type==='pump'&&x.id==='PS-002'))
 assert.ok(filterEntities({currentExtent:true,bounds:[CENTER[0]-.01,CENTER[1]-.01,CENTER[0]+.01,CENTER[1]+.01]}).length<items.length)
})

test('框选/圈选会命中范围内的点及与范围相交的管线',()=>{
 const testEntities=[
  {id:'inside',feature:{geometry:{type:'Point',coordinates:[0,0]}}},
  {id:'outside',feature:{geometry:{type:'Point',coordinates:[4,4]}}},
  {id:'crossing',feature:{geometry:{type:'LineString',coordinates:[[-2,0],[2,0]]}}}
 ]
 assert.equal(geometryIntersectsBounds(testEntities[2].feature.geometry,[-.5,-.5,.5,.5]),true)
 assert.deepEqual(selectInBounds([-.5,-.5,.5,.5],testEntities),['inside','crossing'])
 assert.deepEqual(selectInCircle([0,0],120,testEntities),['inside','crossing'])
 assert.equal(geometryIntersectsCircle(testEntities[2].feature.geometry,[0,0],1),true)
})

test('距离与面积量算采用地理坐标近似，并保持单位明确',()=>{
 const a=[119.75,30.25],b=[119.76,30.25]
 assert.ok(distanceKm(a,b)>0.8&&distanceKm(a,b)<1.1)
 assert.ok(pathDistanceKm([a,b,[119.76,30.26]])>1)
 assert.ok(polygonAreaKm2([[0,0],[.01,0],[.01,.01],[0,.01]])>1)
 assert.equal(polygonAreaKm2([[0,0],[1,1]]),0)
})

test('视角与专题状态按项目和用户隔离且无效选择会回退',()=>{
 const a=contextKey('site-a','user-a'),b=contextKey('site-b','user-a'),c=contextKey('site-a','user-b')
 saveView(a,{...getView(a),center:[119.7,30.2],zoom:14,theme:'monitoring',metric:'velocity',selected:'PS-001',selectedIds:['PS-001'],filterDistrict:'district-west',compareIds:['MP-001']})
 assert.deepEqual(getView(a).center,[119.7,30.2]);assert.equal(getView(a).theme,'monitoring');assert.equal(getView(a).selected,'PS-001')
 assert.equal(getView(b).theme,'facility');assert.equal(getView(c).filterDistrict,'all')
 const invalid=restoreView({center:[Infinity,20],zoom:99,selected:'missing',selectedIds:['missing'],theme:'wrong',baseMode:'wrong'})
 assert.deepEqual(invalid.center,CENTER);assert.equal(invalid.zoom,18);assert.equal(invalid.selected,null);assert.deepEqual(invalid.selectedIds,[]);assert.equal(invalid.baseMode,'osm')
})

test('对象详情优先监测信号，图标与竖向滚动条遵循统一规范',()=>{
 const page=fs.readFileSync(new URL('./GisMapPage.vue',import.meta.url),'utf8')
 const styles=fs.readFileSync(new URL('./layout.css',import.meta.url),'utf8')
 const shared=fs.readFileSync(new URL('../../waterx-components.css',import.meta.url),'utf8')
 const icons=fs.readFileSync(new URL('../../../public/waterx-nav-icons.svg',import.meta.url),'utf8')
 assert.match(page,/activeTab=ref<[^>]+>\('signals'\)/)
 assert.match(page,/activeTab.value='signals'/)
 assert.ok(page.indexOf('>监测信号</button>')<page.indexOf('>基本信息</button>'))
 assert.match(styles,/gis-panel-orb\{[^}]*width:44px;height:44px/)
 assert.match(styles,/detail-orb\{[^}]*right:16px;top:16px/)
 assert.match(shared,/width: var\(--wx-scrollbar-size, 1px\)/)
 assert.match(icons,/M12 4v17/)
 assert.match(icons,/stroke-dasharray="2 2"/)
})

test('三个模块的全屏入口复用孪生同款正常及退出样式',()=>{
 const gis=fs.readFileSync(new URL('./GisMapPage.vue',import.meta.url),'utf8')
 const cockpit=fs.readFileSync(new URL('../management-cockpit/ManagementCockpit.vue',import.meta.url),'utf8')
 const twin=fs.readFileSync(new URL('../digital-twin/scene.html',import.meta.url),'utf8')
 const shared=fs.readFileSync(new URL('../../waterx-components.css',import.meta.url),'utf8')
 for(const page of [gis,cockpit,twin]) assert.match(page,/wx-fullscreen-action/)
 assert.match(cockpit,/:aria-pressed="fullscreen"/)
 assert.match(shared,/#app \.wx-fullscreen-action\[aria-pressed="true"\]/)
 assert.match(shared,/height:34px;min-height:34px/)
})

test('主产品入口命名统一且没有嵌入原型页',()=>{
 const shell=fs.readFileSync(new URL('../../App.vue',import.meta.url),'utf8')
 const page=fs.readFileSync(new URL('./GisMapPage.vue',import.meta.url),'utf8')
 assert.ok(shell.indexOf('aria-label="管理驾驶舱"')<shell.indexOf('aria-label="GIS 一张图"'))
 assert.ok(shell.indexOf('aria-label="GIS 一张图"')<shell.indexOf('aria-label="数字孪生"'))
 assert.doesNotMatch(page,/<iframe|fetch\(|XMLHttpRequest/)
 assert.match(page,/map\?\.remove\(\)/)
 assert.match(page,/tile\.openstreetmap\.org/)
 assert.match(page,/© OpenStreetMap contributors/)
})
