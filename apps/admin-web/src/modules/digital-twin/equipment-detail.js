/* WaterX local demonstration: recognisable, unbranded wastewater equipment.
   Geometry dimensions follow the existing illustrative layout, not shop drawings. */

  'use strict';
  export function createEquipmentDetails(api) {
    const {THREE: T, nameplate, rotors} = api;
    const mats = new Map(), geos = new Map();
    const C = {steel:0xa7b5b8, edge:0x788a90, dark:0x34444c, black:0x222c30, shell:0xd4ddda, rubber:0x293135, blue:0x40788e, brass:0xb69b64};
    function mat(color, extra = {}) { const key = color + JSON.stringify(extra); if (!mats.has(key)) mats.set(key,new T.MeshStandardMaterial({color,roughness:.43,metalness:.58,...extra})); return mats.get(key); }
    function geo(key,create) { if(!geos.has(key))geos.set(key,create());return geos.get(key); }
    function mesh(g,geometry,material,x=0,y=0,z=0){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
    function b(g,x,y,z,w,h,d,color=C.steel,extra){return mesh(g,geo(`b${w},${h},${d}`,()=>new T.BoxGeometry(w,h,d)),mat(color,extra),x,y,z);}
    function rounded(g,x,y,z,w,h,d,color,bevel=.07){
      const geometry=geo(`rb${w},${h},${d},${bevel}`,()=>{const s=new T.Shape();s.moveTo(-w/2+bevel,-h/2+bevel);s.lineTo(w/2-bevel,-h/2+bevel);s.lineTo(w/2-bevel,h/2-bevel);s.lineTo(-w/2+bevel,h/2-bevel);s.closePath();const q=new T.ExtrudeGeometry(s,{steps:1,depth:d-2*bevel,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2});q.translate(0,0,-d/2+bevel);return q;});
      return mesh(g,geometry,mat(color),x,y,z);
    }
    function cy(g,x,y,z,r,h,color=C.steel,axis='y',r2=r,segments=24){const m=mesh(g,geo(`c${r},${r2},${h},${segments}`,()=>new T.CylinderGeometry(r,r2,h,segments)),mat(color),x,y,z);if(axis==='x')m.rotation.z=-Math.PI/2;if(axis==='z')m.rotation.x=Math.PI/2;return m;}
    function sphere(g,x,y,z,r,color,sx=1,sy=1,sz=1){const m=mesh(g,geo('sphere',()=>new T.SphereGeometry(1,20,12)),mat(color),x,y,z);m.scale.set(r*sx,r*sy,r*sz);return m;}
    function ring(g,x,y,z,r,t,color=C.steel,axis='z'){const m=mesh(g,geo(`tor${r},${t}`,()=>new T.TorusGeometry(r,t,6,24)),mat(color),x,y,z);if(axis==='y')m.rotation.x=Math.PI/2;if(axis==='x')m.rotation.y=Math.PI/2;return m;}
    function rod(g,a,c,r=.06,color=C.steel){const p=new T.Vector3(...a),v=new T.Vector3(...c).sub(p);if(v.length()<.001)return;const m=mesh(g,geo('rod',()=>new T.CylinderGeometry(1,1,1,10)),mat(color));m.scale.set(r,v.length(),r);m.position.copy(p.addScaledVector(v,.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;}
    function tubes(g,points,r=.12,color=C.steel){for(let i=1;i<points.length;i++){const m=rod(g,points[i-1],points[i],r,color);if(m)m.material=api.pipeMaterial(color);}for(let i=1;i<points.length-1;i++){const m=sphere(g,...points[i],r,color);m.material=api.pipeMaterial(color);}}
    function batch(g,geometry,material,items){const m=new T.InstancedMesh(geometry,material,items.length);const o=new T.Object3D();items.forEach((it,i)=>{o.position.set(...it.p);o.rotation.set(...(it.r||[0,0,0]));o.scale.set(...(it.s||[1,1,1]));o.updateMatrix();m.setMatrixAt(i,o.matrix);});m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
    function boxes(g,items,color=C.steel){return batch(g,geo('unitbox',()=>new T.BoxGeometry(1,1,1)),mat(color),items);}
    function flange(g,x,y,z,r,axis='z'){
      const a=new T.Group();a.position.set(x,y,z);if(axis==='x')a.rotation.y=Math.PI/2;if(axis==='y')a.rotation.x=Math.PI/2;g.add(a);
      cy(a,0,0,0,r*1.28,.13,C.steel,'z');cy(a,0,0,.075,r*1.01,.026,C.rubber,'z');
      const pts=[];for(let i=0;i<8;i++){const t=i*Math.PI/4;pts.push({p:[Math.cos(t)*r*1.13,Math.sin(t)*r*1.13,.11],r:[Math.PI/2,0,0],s:[.065,.11,.065]});}batch(a,geo('hex',()=>new T.CylinderGeometry(1,1,1,6)),mat(C.edge),pts);return a;
    }
    function fins(g,axis,length,r,n=12,color=C.edge,center=[0,0,0]){const q=[];for(let i=0;i<n;i++){const a=i*Math.PI*2/n;if(axis==='y')q.push({p:[center[0]+Math.sin(a)*r,center[1],center[2]+Math.cos(a)*r],r:[0,a,0],s:[.065,length,.17]});else q.push({p:[center[0],center[1]+Math.sin(a)*r,center[2]+Math.cos(a)*r],r:[a,0,0],s:[length,.065,.17]});}boxes(g,q,color);}
    function feet(g,w,d,y=-1.7){const q=[];for(const x of [-w/2,w/2])for(const z of [-d/2,d/2]){q.push({p:[x,y,z],s:[.45,.25,.48]});cy(g,x,y+.17,z,.085,.14,C.steel,'y',.085,6);}boxes(g,q,C.rubber);}
    function status(main,g,e,x,y,z){const m=sphere(g,x,y,z,.075,e.status==='备用'?0x7c8688:0x3ca56c);m.material=m.material.clone();main.userData.statusLamp=m;return main;}
    function independent(main){main.material=main.material.clone();return main;}
    let screenTexture, dialTexture;
    function screen(g,x,y,z,w=.9,h=.55){
      if(!screenTexture){const c=document.createElement('canvas');c.width=256;c.height=128;const q=c.getContext('2d');q.fillStyle='#193f46';q.fillRect(0,0,256,128);q.font='20px monospace';q.fillStyle='#b3d1c7';q.fillText('LOCAL / AUTO',15,31);q.strokeStyle='#84b5a9';q.beginPath();q.moveTo(15,99);for(let i=0;i<12;i++)q.lineTo(15+i*20,76-Math.sin(i)*14);q.stroke();screenTexture=new T.CanvasTexture(c);screenTexture.colorSpace=T.SRGBColorSpace;}
      b(g,x,y,z,w+.12,h+.12,.07,C.black);const m=mesh(g,geo(`plane${w},${h}`,()=>new T.PlaneGeometry(w,h)),new T.MeshBasicMaterial({map:screenTexture}),x,y,z+.04);return m;
    }
    function dial(g,x,y,z,r=.24){
      if(!dialTexture){const c=document.createElement('canvas');c.width=c.height=128;const q=c.getContext('2d');q.fillStyle='#ecece0';q.fillRect(0,0,128,128);q.strokeStyle='#34444a';q.lineWidth=2;for(let i=0;i<=10;i++){const a=(.75+i*.15)*Math.PI;q.beginPath();q.moveTo(64+Math.cos(a)*46,64+Math.sin(a)*46);q.lineTo(64+Math.cos(a)*(i%2?38:34),64+Math.sin(a)*(i%2?38:34));q.stroke();}q.lineWidth=4;q.beginPath();q.moveTo(64,64);q.lineTo(42,29);q.stroke();q.fillStyle='#7f2c23';q.beginPath();q.arc(64,64,6,0,Math.PI*2);q.fill();dialTexture=new T.CanvasTexture(c);dialTexture.colorSpace=T.SRGBColorSpace;}
      cy(g,x,y,z,r*1.15,.13,C.steel,'z');mesh(g,geo(`dial${r}`,()=>new T.CircleGeometry(r,24)),new T.MeshBasicMaterial({map:dialTexture}),x,y,z+.075);
    }
    function motor(g,x,y,z,r,len,color,axis='x'){
      const m=cy(g,x,y,z,r,len,color,axis);fins(g,axis,len*.77,r*.97,12,color,[x,y,z]);
      if(axis==='x'){cy(g,x+len/2,y,z,r*.96,.19,C.dark,'x');cy(g,x-len/2,y,z,r*.82,.22,color,'x');b(g,x,y+r+.2,z,len*.42,.38,r*.9,color);}
      else {cy(g,x,y+len/2,z,r*.92,.17,C.dark);b(g,x+r*.83,y+.1,z,.48,.45,.55,color);}
      return m;
    }
    function curvedPropeller(g,r,eid,z=0){
      const rotor=new T.Group();rotor.position.z=z;g.add(rotor);
      const geom=geo(`prop${r}`,()=>{const s=new T.Shape();s.moveTo(.04*r,.12*r);s.bezierCurveTo(.10*r,.50*r,.40*r,.93*r,.04*r,r);s.bezierCurveTo(-.30*r,.91*r,-.46*r,.47*r,-.13*r,.16*r);s.closePath();const a=new T.ExtrudeGeometry(s,{depth:.055,bevelEnabled:true,bevelSize:.025,bevelThickness:.02,bevelSegments:1,steps:1,curveSegments:8});a.translate(0,0,-.035);return a;});
      for(let i=0;i<3;i++){const m=mesh(rotor,geom,mat(C.steel,{side:T.DoubleSide}));m.rotation.z=i*Math.PI*2/3;m.rotation.y=.25;}
      sphere(rotor,0,0,.09,r*.21,C.steel,1,1,1.35);rotors.push({group:rotor,id:eid});return rotor;
    }
    function submersible(g,e,base){
      cy(g,0,-1.46,.12,1.08,.67,base);const main=independent(cy(g,0,.05,0,.8,2.22,base));fins(g,'y',1.42,.8,12,base);
      sphere(g,0,1.10,0,.8,base,1,.35,1);cy(g,0,-.98,0,.82,.18,C.edge);cy(g,0,-1.89,.14,.84,.18,C.dark);
      ring(g,0,1.47,0,.30,.073,C.steel);feet(g,1.45,1.25,-1.96);
      tubes(g,[[.78,-1.4,.12],[1.67,-1.4,.12],[1.67,2.1,.12],[1.67,2.1,-2.4]],.35,C.edge);flange(g,1.67,.85,.12,.35,'y');
      for(const x of [-1.22,-.91]){rod(g,[x,-1.75,-.53],[x,3.2,-.53],.055);b(g,x,3.23,-.53,.18,.14,.32);}
      tubes(g,[[0,1.15,-.35],[-.3,2.25,-.45],[-1.13,3.10,-.53]],.045,C.black);
      const bolts=[];for(let i=0;i<8;i++){const a=i*Math.PI/4;bolts.push({p:[Math.cos(a)*.85,-1.06,.12+Math.sin(a)*.85],s:[.065,.10,.065]});}batch(g,geo('hex',()=>new T.CylinderGeometry(1,1,1,6)),mat(C.steel),bolts);
      nameplate(g,e.id,0,.4,.81,.85);return main;
    }
    function axialPump(g,e,base){
      const main=independent(cy(g,0,0,-.32,.67,1.95,base,'z'));sphere(g,0,0,-1.34,.66,base,1,1,.32);cy(g,0,0,.68,1.30,.38,C.steel,'z');ring(g,0,0,.90,1.24,.065,C.edge);
      curvedPropeller(g,1.11,e.id,1.00);flange(g,0,0,.62,1.03,'z');
      b(g,0,-.94,-.55,1.3,.25,1.6,C.dark);for(const x of [-.86,.86])rod(g,[x,-1.32,-.83],[x,4,-.83],.08);rod(g,[-1,4,-.83],[1,4,-.83],.08);
      tubes(g,[[.25,.55,-.7],[.7,2,-1],[.82,4,-.83]],.045,C.black);ring(g,0,.94,-.6,.25,.06);return main;
    }
    function dryPump(g,e,base){
      const main=independent(motor(g,.15,-.5,0,.53,1.45,base,'x'));
      rounded(g,-1.08,-.5,0,1.0,1.25,1.16,base,.16);cy(g,-1.59,-.53,0,.37,.75,C.edge,'x');flange(g,-1.98,-.53,0,.37,'x');
      tubes(g,[[-1.08,.11,0],[-1.08,1.35,0],[-1.08,1.35,-1.20]],.30,C.edge);flange(g,-1.08,.55,0,.30,'y');
      b(g,0,-1.18,0,3.55,.23,1.6,C.dark);b(g,0,-1.46,0,3.8,.30,1.9,0xb2b1a8,{roughness:.9,metalness:0});feet(g,2.8,1.0,-1.29);dial(g,-.72,.77,.35,.18);nameplate(g,e.id,.26,-.45,.55,.8);return main;
    }
    function metering(g,e,base){
      b(g,0,-1.64,0,2.7,.20,1.95,C.dark);const main=independent(rounded(g,-.12,-.80,0,1.45,1.35,1.0,base));motor(g,-.12,.15,0,.4,.65,base,'y');
      cy(g,-.12,-.78,.72,.50,.52,C.black,'z');flange(g,-.12,-.78,.95,.43,'z');
      tubes(g,[[-.12,-1.12,.78],[-.12,-1.49,.78],[-1.02,-1.49,.78]],.085,0xb2c0bd);
      tubes(g,[[-.12,-.25,.78],[-.12,.90,.78],[1.05,.90,.78],[1.05,.90,-.60]],.085,0xb2c0bd);cy(g,.42,.37,.78,.20,.67,C.steel);dial(g,.91,.95,.85,.16);
      screen(g,-.16,-.74,.525,.57,.27);status(main,g,e,.40,-.34,.55);return main;
    }
    function blower(g,e,base){
      if(e.id.startsWith('ODF'))return exhaust(g,e,base);
      b(g,0,-1.62,0,7.35,.30,5.40,0xa9aea7,{roughness:.9,metalness:0});b(g,0,-1.34,0,6.9,.28,5,C.dark);feet(g,5.8,3.8,-1.41);
      const main=independent(rounded(g,0,.66,0,6.7,3.70,4.68,base,.10));rounded(g,0,2.56,0,6.84,.18,4.82,C.shell,.045);
      const louvers=[];for(const x of [-2.19,0,2.19]){rounded(g,x,.66,2.37,2.08,3.52,.10,C.shell,.035);rod(g,[x+.78,.30,2.46],[x+.78,.88,2.46],.038,C.dark);for(const y of [-.76,.06,.88,1.70]){cy(g,x-.9,y,2.445,.035,.045,C.edge,'z',.035,6);}}
      for(let j=0;j<10;j++)louvers.push({p:[-2.19,-.5+j*.19,2.46],r:[.16,0,0],s:[1.68,.075,.11]});for(let j=0;j<13;j++)louvers.push({p:[3.37,.12+j*.13,-.43],s:[.08,.055,2.45]});boxes(g,louvers,C.dark);
      screen(g,0,1.24,2.46,1.08,.65);status(main,g,e,-.29,.61,2.52);sphere(g,.27,.61,2.52,.09,0xb64734);nameplate(g,e.id,2.19,1.21,2.47,1.49);
      tubes(g,[[1.9,2.65,-.82],[1.9,4.3,-.82],[1.9,4.3,-5]],.47,C.steel);flange(g,1.9,3.16,-.82,.47,'y');flange(g,1.9,4.3,-3.42,.47,'z');
      cy(g,-2.03,3.10,-.93,.57,1.04,C.steel);cy(g,-2.03,3.65,-.93,.66,.13,C.dark);ring(g,-2.03,2.71,-.93,.57,.055,C.edge,'y');
      dial(g,2.74,3.11,.02,.25);rod(g,[2.74,2.63,.02],[2.74,2.91,.02],.047);return main;
    }
    function exhaust(g,e,base){
      b(g,0,-1.64,0,6.3,.25,4.3,C.dark);feet(g,4.9,2.8,-1.4);
      const casing=geo('fanVolute',()=>{const s=new T.Shape();s.moveTo(-.7,-1.1);s.bezierCurveTo(-2,-.65,-1.9,1.27,-.3,1.58);s.bezierCurveTo(1.4,1.88,2.0,.13,.91,-.71);s.lineTo(.74,-1.1);s.closePath();const a=new T.ExtrudeGeometry(s,{depth:1.34,steps:1,bevelEnabled:true,bevelThickness:.08,bevelSize:.08,bevelSegments:2,curveSegments:16});a.translate(0,0,-.67);return a;});
      const main=independent(mesh(g,casing,mat(base),-.8,0,0));cy(g,-.95,.25,.80,.91,.32,base,'z');ring(g,-.95,.25,1.02,.8,.10,C.steel);cy(g,-.95,.25,1.05,.69,.035,C.dark,'z');
      rounded(g,-.61,1.62,-.1,1.26,.83,1.26,base);flange(g,-.61,2.08,-.1,.63,'y');motor(g,1.78,-.47,-.20,.62,1.35,base,'x');b(g,.67,-.40,-.20,1.0,.6,.7,C.dark);
      nameplate(g,e.id,-.83,-.76,.72,1.08);return main;
    }
    function mixer(g,e,base){
      if(!e.id.startsWith('MIX-'))return verticalMixer(g,e,base);
      const main=independent(cy(g,0,0,-.38,.59,1.20,base,'z'));sphere(g,0,0,-1.04,.58,base,1,1,.3);flange(g,0,0,-.15,.55,'z');curvedPropeller(g,e.id.includes('-N')?1.18:.90,e.id,.42);
      b(g,0,-.78,-.59,1.08,.20,.8,C.edge);rod(g,[.9,-1.4,-.85],[.9,4.7,-.85],.105);for(const y of [-.68,3.8])b(g,.9,y,-.85,.40,.20,.6,C.steel);
      tubes(g,[[0,.47,-.56],[.5,1.42,-.81],[.9,4.55,-.85]],.045,C.black);ring(g,0,.75,-.48,.21,.045);return main;
    }
    function verticalMixer(g,e,base){
      const main=independent(motor(g,0,.82,0,.45,1.07,base,'y'));rounded(g,0,-.02,0,1.1,.52,.95,C.dark);b(g,0,-.42,0,4.3,.20,1.4,C.steel);rod(g,[0,-.31,0],[0,-4.0,0],.09,C.steel);
      const horizontal=new T.Group();horizontal.position.y=-3.38;horizontal.rotation.x=Math.PI/2;g.add(horizontal);curvedPropeller(horizontal,e.id.startsWith('FLOC')?1.58:1.10,e.id,0);
      nameplate(g,e.id,0,.77,.47,.65);return main;
    }
    function sensor(g,e,base){
      const main=independent(rounded(g,0,.26,0,1.18,1.10,.59,base,.09));screen(g,0,.37,.32,.84,.43);
      b(g,0,1.00,0,1.56,.12,1.0,C.steel);b(g,-.75,.61,0,.075,.76,1.0,C.steel);b(g,.75,.61,0,.075,.76,1.0,C.steel);
      for(const x of [-.30,0,.30])cy(g,x,-.09,.336,.053,.04,x===-.30?0x50a185:C.dark,'z');
      const feetY=1.83-(e.y||0);rod(g,[0,-.37,-.15],[0,feetY,-.15],.075);b(g,0,feetY,-.15,.60,.12,.54);rod(g,[0,-.42,-.15],[.75,-.42,-.15],.06);
      rod(g,[.75,-.42,-.15],[.75,-3.65,-.15],.07);cy(g,.75,-3.88,-.15,.15,.58,C.steel);cy(g,.75,-4.2,-.15,.16,.12,C.black);sphere(g,.75,-4.29,-.15,.12,0x345d61,1,.5,1);
      tubes(g,[[.25,-.3,0],[.57,-.62,.05],[.91,-.32,-.12],[.90,-3.59,-.15]],.027,C.black);nameplate(g,e.id,0,.93,.515,.72);return main;
    }
    function valve(g,e,base){
      const main=independent(cy(g,0,.02,0,.54,.42,base,'x'));cy(g,0,.02,0,.38,2.4,C.steel,'x');flange(g,-.36,.02,0,.43,'x');flange(g,.36,.02,0,.43,'x');
      rod(g,[0,.25,0],[0,1.21,0],.10,C.steel);rounded(g,0,.88,0,.65,.43,.64,base);const wheel=ring(g,.52,1.14,0,.48,.055,C.dark,'x');
      for(let i=0;i<3;i++){const a=i*Math.PI*2/3;rod(g,[.52,1.14,0],[.52,1.14+Math.sin(a)*.44,Math.cos(a)*.44],.035,C.dark);}cy(g,.33,1.14,0,.09,.37,C.steel,'x');b(g,-.33,1.27,0,.32,.34,.35,C.dark);
      for(const x of [-.98,.98]){b(g,x,-.57,0,.13,.8,.24,C.edge);b(g,x,-1.01,0,.65,.15,.6,C.edge);}nameplate(g,e.id,0,.63,.34,.6);return main;
    }
    function tank(g,e,base){
      if(e.id==='PAM-01')return polymer(g,e,base);
      b(g,0,-1.62,0,6.3,.28,6.3,0xaaa99f,{metalness:0,roughness:.85});const main=independent(cy(g,0,.72,0,2.22,4.40,base));sphere(g,0,2.93,0,2.22,C.shell,1,.34,1);sphere(g,0,-1.44,0,2.22,C.shell,1,.09,1);
      for(const y of [-1.20,1.64])ring(g,0,y,0,2.24,.055,C.edge,'y');cy(g,0,3.77,0,.54,.16,C.dark);cy(g,0,3.9,0,.40,.12,C.steel);
      tubes(g,[[-1.28,3.2,0],[-1.28,4.20,0],[-1.90,4.20,0]],.10,C.steel);tubes(g,[[0,-.8,2.06],[0,-.8,2.72],[1.10,-.8,2.72]],.16,C.dark);flange(g,0,-.8,2.57,.16,'z');
      const ladder=[];for(const x of [-.55,.55])rod(g,[x,-1.55,2.28],[x,3.7,2.28],.055);for(let y=-1.30;y<3.60;y+=.44)ladder.push({p:[0,y,2.28],s:[1.17,.075,.075]});boxes(g,ladder);
      rod(g,[1.53,-1.3,1.63],[1.53,2.75,1.63],.075,C.shell);for(const y of [-1.1,2.57])b(g,1.53,y,1.64,.32,.17,.20,C.dark);nameplate(g,e.id,-.10,1.06,2.245,1.13);return main;
    }
    function polymer(g,e,base){
      const main=independent(rounded(g,0,-.35,0,4.7,2.48,3.45,C.shell));b(g,0,.95,0,4.85,.14,3.60,C.steel);for(const x of [-1.45,0,1.45]){motor(g,x,1.61,.28,.22,.90,base,'y');b(g,x,1.14,.28,.85,.16,.86,C.steel);}
      const hopper=cy(g,-1.45,2.06,-.90,.53,.87,C.steel,'y',.16);cy(g,-1.45,2.52,-.90,.55,.09,C.dark);screen(g,0,-.06,1.77,1.03,.59);feet(g,3.80,2.80,-1.69);nameplate(g,e.id,1.51,.12,1.75,.8);return main;
    }
    function dewater(g,e,base){
      if(e.id.startsWith('SAND'))return sandClassifier(g,e,base);
      if(e.id.startsWith('THK'))return thickener(g,e,base);
      b(g,0,-1.44,0,9.6,.29,3.62,C.dark);feet(g,7.8,2.7,-1.61);
      const main=independent(cy(g,.12,.17,0,1.08,5.8,C.shell,'x'));cy(g,3.35,.17,0,.54,1.05,C.steel,'x',1.08);cy(g,-3.1,.17,0,1.08,.55,C.steel,'x');
      for(const x of [-2.62,-.7,1.40])ring(g,x,.17,0,1.10,.040,C.edge,'x');b(g,.15,1.28,0,5.95,.13,.54,C.steel);for(const x of [-2.55,2.55])rod(g,[x,-.5,-.7],[x,-1.24,-.7],.18,C.edge);
      motor(g,-3.15,-.60,1.27,.51,1.95,base,'x');rounded(g,-4.31,-.04,.30,.42,2.13,2.95,C.dark,.12);cy(g,4.12,.17,0,.58,.48,base,'x');
      tubes(g,[[4.4,.18,0],[5.0,.18,0],[5.0,.18,-1.5]],.11,C.steel);b(g,2.82,-1.00,0,.80,.57,1.0,C.edge);b(g,-1.80,-1.0,0,.84,.57,.86,C.edge);
      nameplate(g,e.id,0,.35,1.095,1.25);status(main,g,e,-2.02,.54,1.13);return main;
    }
    function thickener(g,e,base){
      b(g,0,-1.58,0,7.2,.22,3.6,C.dark);const main=independent(rounded(g,0,.02,0,6.2,2.55,2.80,C.shell));for(const x of [-2.02,0,2.02]){rounded(g,x,.13,1.43,1.83,2.21,.07,0xb6c4c1,.025);rod(g,[x+.54,-.02,1.49],[x+.54,.51,1.49],.035,C.dark);}
      motor(g,3.24,.16,0,.49,.77,base,'x');tubes(g,[[-2.40,1.31,0],[-2.40,1.97,0],[-3.85,1.97,0]],.23);feet(g,5.4,2.6,-1.63);nameplate(g,e.id,0,.7,1.485,1.03);return main;
    }
    function sandClassifier(g,e,base){
      const main=independent(rounded(g,-.15,-.23,.55,3.2,2.15,2.35,C.shell));const screw=new T.Group();screw.rotation.x=.53;screw.position.set(0,.55,-.65);g.add(screw);cy(screw,0,0,-2.10,.36,4.7,C.steel,'z');cy(screw,0,0,-4.54,.43,.21,base,'z');motor(screw,0,0,-4.92,.36,.52,base,'y');
      for(const x of [-1.28,1.28])for(const z of [-.34,1.34])b(g,x,-1.34,z,.15,1.11,.20,C.dark);b(g,-.15,.89,.55,3.39,.12,2.52,C.edge);nameplate(g,e.id,0,.17,1.765,.87);return main;
    }
    function screenModel(g,e,base){
      if(e.id.startsWith('CON'))return conveyor(g,e,base);
      const body=new T.Group();body.rotation.x=.57;body.position.y=-.28;g.add(body);const main=independent(b(body,0,0,0,3.3,.34,7.25,base));
      b(body,0,.2,0,2.80,.10,6.85,C.dark);const bars=[];for(let x=-1.27;x<=1.30;x+=e.id.startsWith('GR-F')?.12:.21)bars.push({p:[x,.30,0],s:[.044,.14,6.80]});for(let z=-3.15;z<3.20;z+=.90)bars.push({p:[0,.41,z],s:[2.73,.09,.07]});boxes(body,bars,C.steel);
      for(const x of [-1.53,1.53])b(body,x,.38,0,.22,.58,7.27,C.steel);rounded(body,0,.46,-3.5,3.37,.93,.88,C.shell);motor(body,1.71,.62,-3.4,.37,.86,base,'x');b(body,0,-.32,-3.11,2.64,.9,.80,C.steel);
      for(const x of [-1.52,1.52])rod(g,[x,-1.67,-1.8],[x,1.31,-1.8],.085,C.edge);nameplate(g,e.id,0,.10,2.00,.80);return main;
    }
    function conveyor(g,e,base){
      const main=independent(rounded(g,0,-.17,0,9.0,.67,1.36,C.shell));b(g,0,.20,0,8.4,.09,.94,C.black);for(const z of [-.59,.59])rod(g,[-4.4,.44,z],[4.4,.44,z],.075,C.steel);
      const q=[];for(let x=-3.6;x<=3.7;x+=1.2)q.push({p:[x,.24,0],s:[.035,.04,.90]});for(const x of [-3.15,3.15])for(const z of [-.46,.46])q.push({p:[x,-1.05,z],s:[.15,1.19,.20]});boxes(g,q,C.edge);motor(g,-4.68,-.08,0,.31,.78,base,'x');nameplate(g,e.id,0,-.16,.70,.87);return main;
    }
    function cabinet(g,e,base){
      const main=independent(rounded(g,0,.27,0,4.55,3.94,3.5,C.shell));b(g,0,-1.74,0,4.80,.20,3.75,C.dark);rounded(g,0,2.29,0,4.76,.16,3.73,C.shell);
      for(const x of [-1.08,1.08]){rounded(g,x,.24,1.795,2.09,3.76,.085,C.shell,.025);rod(g,[x+.74,.14,1.87],[x+.74,.77,1.87],.045,C.dark);}
      const vents=[];for(let y=-1.37;y<-.30;y+=.14)for(const x of [-1.08,1.08])vents.push({p:[x,y,1.858],s:[1.65,.046,.044]});boxes(g,vents,C.dark);
      screen(g,-1.08,1.1,1.858,.90,.51);status(main,g,e,-1.42,.57,1.90);sphere(g,-.99,.57,1.90,.068,0xb3422a);
      const warning=new T.Shape();warning.moveTo(0,.18);warning.lineTo(-.18,-.15);warning.lineTo(.18,-.15);warning.closePath();mesh(g,geo('warning',()=>new T.ShapeGeometry(warning)),mat(0xd4ae3c,{metalness:0}),1.1,1.17,1.868);rod(g,[1.1,1.12,1.87],[1.1,1.26,1.87],.018,C.black);
      nameplate(g,e.id,1.08,.58,1.87,.94);return main;
    }
    function filter(g,e,base){
      b(g,0,-1.65,0,6.00,.24,9.25,C.dark);const main=independent(cy(g,0,.12,0,.33,8.8,base,'z'));
      const discGeo=geo('filterDisc',()=>new T.CylinderGeometry(2.15,2.15,.12,32));const discs=[];for(let z=-3.4;z<=3.5;z+=1.13)discs.push({p:[0,.16,z],r:[Math.PI/2,0,0]});batch(g,discGeo,mat(0xa1aba0,{roughness:.95,metalness:0}),discs);
      const spokes=[];for(let z=-3.4;z<=3.5;z+=1.13){ring(g,0,.16,z,2.14,.06,C.steel);cy(g,0,.16,z,.46,.24,C.edge,'z');for(let i=0;i<8;i++){const a=i*Math.PI/4;spokes.push({p:[Math.sin(a)*1.1,.16+Math.cos(a)*1.1,z+.08],r:[0,0,-a],s:[.065,2.15,.045]});}}
      boxes(g,spokes,C.steel);for(const x of [-2.44,2.44]){rod(g,[x,-1.39,-4.3],[x,-1.39,4.3],.085,C.edge);rod(g,[x,1.8,-4.3],[x,1.8,4.3],.055,C.steel);for(const z of [-4.3,0,4.3])rod(g,[x,-1.40,z],[x,1.8,z],.055,C.steel);}
      motor(g,0,.23,4.26,.44,.61,base,'y');tubes(g,[[2.64,1.1,-3.8],[2.64,1.1,3.8]],.10,C.steel);nameplate(g,e.id,0,.67,4.49,.88);return main;
    }
    function diffuser(g,e,base){
      const main=independent(cy(g,0,0,0,.14,54,base,'x'));const membrane=geo('diffuser',()=>new T.CylinderGeometry(.28,.33,.11,16)),items=[];
      for(const x of [-24,-18,-12,-6,0,6,12,18,24]){rod(g,[x,0,-10],[x,0,10],.09,0x707978);for(const z of [-9,-6,-3,3,6,9])items.push({p:[x,.10,z]});for(const z of [-5,0,5])b(g,x,-.22,z,.34,.28,.37,C.edge);}
      batch(g,membrane,mat(0x484c47,{roughness:.9,metalness:0}),items);const rings=items.map(it=>({p:[it.p[0],it.p[1]-.055,it.p[2]],r:[Math.PI/2,0,0]}));batch(g,geo('diffuser-rim',()=>new T.TorusGeometry(.29,.025,4,16)),mat(0xb7bbb2),rings);return main;
    }
    function scraper(g,e,base){
      const main=independent(rounded(g,0,.09,0,1.65,.65,1.58,base));motor(g,0,.88,0,.44,.84,base,'y');cy(g,0,-.51,0,.72,.60,C.steel);rod(g,[0,-.8,0],[0,-4.1,0],.17,C.steel);
      if(e.id.startsWith('SCR-')){
        ring(g,0,-.31,0,.74,.07,C.edge,'y');flange(g,0,-.56,0,.51,'y');
      }else {
        for(const z of [-8,8])rod(g,[0,-3.4,z],[0,-.35,z],.08);rod(g,[0,-3.4,-8],[0,-3.4,8],.10);for(const z of [-8,-4,0,4,8])b(g,0,-3.74,z,9.8,.48,.15,C.edge);
      }
      nameplate(g,e.id,0,.21,.81,.83);return main;
    }
    const builders={pump:(g,e,c)=>e.id.startsWith('IRP-')?axialPump(g,e,c):e.parent==='CHEM-01'?metering(g,e,c):e.id.startsWith('P-IN-')?submersible(g,e,c):dryPump(g,e,c),blower,mixer,sensor,valve,tank,dewater,screen:screenModel,cabinet,filter,diffuser,scraper};
    return {dispose(){geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());screenTexture?.dispose();dialTexture?.dispose();geos.clear();mats.clear();rotors.length=0;},build(g,e,base){const fn=builders[e.kind];return fn?fn(g,e,base):independent(rounded(g,0,-.20,0,2.1,1.7,1.7,base));}};
  };
