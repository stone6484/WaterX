/* Example service corridors. Road crossings descend before the kerb. */
(function(root){
 const roads=[[-200,0,8,263],[202,0,8,263],[-83,-99,234,8],[151,-99,102,8],[-83,95,234,8],[151,95,102,8],[-111,0,8,184],[29,0,8,184],[97,0,7,184],[150,0,7,184],...[-76,-38,0,38,76].map(z=>[-42,z,137,7])];
 function interval(a,b,road,margin=0){let lo=0,hi=1;for(const [axis,center,width] of [[0,road[0],road[2]],[2,road[1],road[3]]]){const min=center-width/2-margin,max=center+width/2+margin,d=b[axis]-a[axis];if(Math.abs(d)<1e-9){if(a[axis]<min||a[axis]>max)return null;}else{let p=(min-a[axis])/d,q=(max-a[axis])/d;if(p>q)[p,q]=[q,p];lo=Math.max(lo,p);hi=Math.min(hi,q);if(lo>hi)return null;}}return [lo,hi];}
 function underRoads(points){const out=[],margin=2.8,depth=-2.2;const add=p=>{if(!out.length||p.some((n,i)=>Math.abs(n-out[out.length-1][i])>1e-7))out.push(p);};
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],cuts=roads.map(r=>interval(a,b,r,margin)).filter(Boolean).sort((a,b)=>a[0]-b[0]),merged=[];for(const c of cuts){const last=merged[merged.length-1];if(last&&c[0]<=last[1]+1e-7)last[1]=Math.max(last[1],c[1]);else merged.push([...c]);}const at=(t,buried=false)=>[a[0]+(b[0]-a[0])*t,buried?Math.min(depth,a[1]+(b[1]-a[1])*t):a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];add(at(0,!!merged.length&&merged[0][0]<=1e-7));for(const [lo,hi] of merged){if(lo>1e-7)add(at(lo));add(at(lo,true));add(at(hi,true));if(hi<1-1e-7)add(at(hi));}add(at(1,!!merged.length&&merged[merged.length-1][1]>=1-1e-7));}
  return out;
 }
 function reroute(p){let pts=p.points.map(v=>v.slice());
  // Keep long runs off road centrelines and off the biological tanks.
  for(const v of pts){if(p.id.startsWith('W-C')&&v[0]===28)v[0]=20;if(p.id.startsWith('W-T')&&v[0]===98)v[0]=91.5;if(p.id.startsWith('W-F')&&v[0]===149)v[0]=144.5;if(['S-R','F-R'].includes(p.id)&&v[0]===-198)v[0]=-193.5;if(p.id.startsWith('W-B')&&v[0]===-106)v[0]=-103.5;if(p.id==='RAS-M'&&v[2]===-97)v[2]=-91;}
  if(p.id==='RAS-M')pts=[[66,3,111],[89,3,111],[89,3,-91],[89,-5.5,-91],[-102,-5.5,-91],[-102,3,-91],[-102,3,57]];
  if(p.id.startsWith('RAS-C')){const z=p.points[0][2];pts=[[65,-3,z],[90,-3,z],[90,1,z],[90,1,109],[65,1,109]];}
  if(p.id==='AIR-M')pts=[[-39,4,103],[14,4,103],[14,4,-70]];
  if(p.id.startsWith('AIR-B')){const z=-57+(Number(p.id.slice(-1))-1)*38;pts=[[14,4,z-13],[0,4,z-13],[0,2.6,z-13]];}
  return {...p,points:underRoads(pts),source:'示例敷设：绿化带管廊，过路段下穿；非施工设计'};
 }
 const api={roads,interval,underRoads,reroute,radius:p=>Math.max(.035,Number(p.dn.replace(/\D/g,''))/2000)};root.WaterXSiteRouting=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
