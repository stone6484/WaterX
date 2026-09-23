/* Local demonstration geometry. Dimensions follow the fictional case, not construction drawings. */
export function createFacilityDetails(api) {
  const {THREE,box,cylinder,line,pipeDetail,material,waterSurface,cutObjects,waterObjects,colors} = api;
  const steel=0x8c9a9e, darkSteel=0x465258, glass=0x718e99, painted=0x607e87;
  const cube=new THREE.BoxGeometry(1,1,1), rod=new THREE.CylinderGeometry(1,1,1,8);
  const up=new THREE.Vector3(0,1,0), dummy=new THREE.Object3D();

  // Repeated construction components share geometry and one draw call per material.
  function batch(g,geometry,color,items,extra={}) {
    if(!items.length)return null;
    const inst=new THREE.InstancedMesh(geometry,material(color,extra),items.length);
    items.forEach((p,i)=>{
      dummy.position.set(p.x||0,p.y||0,p.z||0);
      dummy.rotation.set(p.rx||0,p.ry||0,p.rz||0);
      if(p.q)dummy.quaternion.copy(p.q);
      dummy.scale.set(p.w||1,p.h||1,p.d||1);
      dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);
    });
    inst.castShadow=true;inst.receiveShadow=true;g.add(inst);return inst;
  }
  function beam(a,b,r=.06){
    const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),delta=vb.clone().sub(va);
    return {x:(a[0]+b[0])/2,y:(a[1]+b[1])/2,z:(a[2]+b[2])/2,w:r,h:delta.length(),d:r,q:new THREE.Quaternion().setFromUnitVectors(up,delta.normalize())};
  }
  function ring(g,inner,outer,y,height,color,start=0,angle=Math.PI*2) {
    const p=[[inner,y],[outer,y],[outer,y+height],[inner,y+height],[inner,y]].map(v=>new THREE.Vector2(...v));
    const mesh=new THREE.Mesh(new THREE.LatheGeometry(p,64,start,angle),material(color,{side:THREE.DoubleSide}));
    mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;
  }
  function roundRail(g,r,y,color=steel){
    const mesh=new THREE.Mesh(new THREE.TorusGeometry(r,.055,6,96),material(color,{metalness:.72,roughness:.33}));
    mesh.rotation.x=Math.PI/2;mesh.position.y=y;g.add(mesh);return mesh;
  }

  function building(g,f) {
    const w=f.w,d=f.d,h=f.h,admin=f.kind==='admin';
    box(g,0,.15,0,w+2,.3,d+2,colors.concrete);
    box(g,0,.33,0,w-.45,.12,d-.45,0x8c9696,{roughness:.78});
    const wallMat={roughness:.86};
    box(g,0,h/2,-d/2,w,h,.5,colors.wall,wallMat);
    box(g,-w/2,h/2,0,.5,h,d,colors.wall,wallMat);
    box(g,w/2,h/2,0,.5,h,d,colors.wall,wallMat);
    const facade=new THREE.Group();g.add(facade);cutObjects.push(facade);
    box(facade,0,h/2,d/2,w,h,.5,colors.wall,wallMat);

    // Sills, reveals and separate frame profiles give the window a real wall opening.
    function windows(parent,z,levels){
      const panes=[],frames=[],sills=[],spac=Math.max(5.4,w/Math.ceil(w/6.3));
      for(const y of levels)for(let x=-w/2+spac*.55;x<w/2-2;x+=spac){
        if(z>0&&y<4.6&&Math.abs(x)<3.3)continue;
        const ww=admin?3.1:3.8,hh=admin?1.85:2.1;
        panes.push({x,y,z,w:ww,h:hh,d:.10});
        for(const dx of [-ww/2,0,ww/2])frames.push({x:x+dx,y,z:z+Math.sign(z)*.07,w:.085,h:hh+.16,d:.13});
        for(const dy of [-hh/2,hh/2])frames.push({x,y:y+dy,z:z+Math.sign(z)*.07,w:ww+.16,h:.09,d:.13});
        sills.push({x,y:y-hh/2-.12,z:z+Math.sign(z)*.11,w:ww+.42,h:.15,d:.46});
      }
      batch(parent,cube,glass,panes,{roughness:.21,metalness:.25});
      batch(parent,cube,steel,frames,{roughness:.32,metalness:.65});
      batch(parent,cube,colors.concrete,sills);
    }
    const levels=admin?[2.4,6.25,10.05]:[h*.66];
    windows(facade,d/2+.32,levels);windows(g,-d/2-.32,levels);
    const belts=[];
    for(const y of admin?[.7,4.25,8.05]:[.6,h-.32]){
      belts.push({x:0,y,z:-d/2-.29,w,h:.22,d:.18});
      box(facade,0,y,d/2+.29,w,.22,.18,colors.concrete);
    }
    batch(g,cube,colors.concrete,belts);

    const doorW=admin?3.6:4.8,doorH=admin?3:4.5,doorZ=d/2+.37;
    box(facade,0,.45+doorH/2,doorZ,doorW+.35,doorH+.24,.19,darkSteel);
    box(facade,0,.45+doorH/2,doorZ+.12,doorW,doorH,.12,admin?glass:0x7e8b8c,{roughness:admin?.24:.58,metalness:.3});
    box(facade,0,.45+doorH/2,doorZ+.21,.055,doorH,.045,0x364850);
    for(const x of [-.27,.27])box(facade,x,1.85,doorZ+.30,.055,.55,.08,0xc4cbca,{metalness:.8,roughness:.24});
    box(g,0,.16,d/2+1.35,doorW+1.2,.32,2.3,colors.concrete);
    const canopy=box(facade,0,doorH+.72,d/2+1.05,doorW+1.2,.14,1.6,painted,{metalness:.3});
    canopy.rotation.x=-.055;
    const joints=[];
    for(let x=-w/2+8;x<w/2;x+=8)joints.push({x,y:h/2,z:d/2+.26,w:.032,h:h-.3,d:.013});
    batch(facade,cube,0xa4acaa,joints);

    // A low-pitch standing-seam roof, gutters and downpipes all disappear when cut.
    const roof=new THREE.Group();g.add(roof);cutObjects.push(roof);
    const rise=admin?.38:1.05,angle=Math.atan(rise/(d/2)),slopeLength=Math.hypot(d/2+.55,rise);
    for(const s of [-1,1]){
      const sheet=box(roof,0,h+rise/2+.15,s*(d/4+.18),w+1.35,.14,slopeLength,colors.roof,{metalness:.5,roughness:.46});
      sheet.rotation.x=s*angle;
    }
    const seams=[];
    for(let x=-w/2-.3;x<w/2+.5;x+=1.25)for(const s of [-1,1])seams.push({x,y:h+rise/2+.24,z:s*(d/4+.18),w:.075,h:.085,d:slopeLength,rx:s*angle});
    batch(roof,cube,0x83979a,seams,{metalness:.58,roughness:.42});
    box(roof,0,h+rise+.25,0,w+1.5,.12,.55,0x83979a,{metalness:.6});
    for(const s of [-1,1]){
      box(roof,0,h+.08,s*(d/2+.58),w+1.1,.23,.23,steel,{metalness:.65});
      for(const x of [-w/2+1,w/2-1])line(roof,[[x,h+.04,s*(d/2+.56)],[x,.65,s*(d/2+.56)],[x,.28,s*(d/2+1)]],steel,.095);
    }
    if(!admin){
      const slats=[];
      for(const x of [-w/2+2.2,w/2-2.2]){
        box(facade,x,h*.37,d/2+.35,2.4,1.75,.15,darkSteel);
        for(let y=h*.37-.7;y<h*.37+.8;y+=.22)slats.push({x,y,z:d/2+.46,w:2.22,h:.095,d:.2,rx:.35});
      }
      batch(facade,cube,steel,slats,{metalness:.5});
    }
    if(f.id==='AIR-01'){
      pipeDetail(g,[[-19,7,-5],[19,7,-5]],.75,0xa5b2b4);
      // BL-01..04 outlet: equipment x + 1.9, global y 6.3, room-local z -5.
      for(const x of [-15.1,-4.1,6.9,17.9])pipeDetail(g,[[x,6.3,-5],[x,7,-5]],.47,0xa5b2b4);
      const supports=[];
      for(let x=-19;x<=19;x+=9.5){supports.push(beam([x,.45,-5],[x,6.3,-5],.1));box(g,x,6.1,-5,2.4,.18,.8,darkSteel);}
      batch(g,rod,steel,supports,{metalness:.55});
    }
  }

  function clarifier(g,f) {
    const r=f.w/2,isSludge=f.kind==='sludgetank';
    cylinder(g,0,-3.35,0,r,.5,colors.concrete,64);
    ring(g,r-.55,r,-3.1,4.9,colors.wall,Math.PI/2,Math.PI);
    const nearWall=ring(g,r-.55,r,-3.1,4.9,colors.wall,-Math.PI/2,Math.PI);cutObjects.push(nearWall);
    ring(g,r-.75,r+.25,1.75,.19,colors.concrete);
    ring(g,r-.57,r-.53,.86,.34,0x777e6a); // Thin, irregular-looking wet line below the coping.
    waterSurface(g,0,0,2*(r-1.3),2*(r-1.3),1,f.kind,true);
    const bridge=new THREE.Group();g.add(bridge);
    box(bridge,0,2.02,0,r*2,.22,1.65,steel,{metalness:.55,roughness:.48});
    const members=[];
    for(const z of [-.78,.78]){
      members.push(beam([-r,3.23,z],[r,3.23,z],.055),beam([-r,2.66,z],[r,2.66,z],.038));
      for(let x=-r+.45;x<=r;x+=2.65)members.push(beam([x,2.11,z],[x,3.23,z],.045));
      members.push(beam([-r,1.72,z],[r,1.72,z],.11));
      for(let x=-r+.2,j=0;x<r-2.2;x+=2.6,j++)members.push(beam([x,j%2?1.71:1.07,z],[Math.min(r,x+2.6),j%2?1.07:1.71,z],.045));
    }
    batch(bridge,rod,steel,members,{metalness:.62,roughness:.4});
    // Perimeter handrail is instanced, preserving silhouette without hundreds of meshes.
    const posts=[];
    for(let i=0;i<Math.ceil(r*2);i++){
      const a=i/Math.ceil(r*2)*Math.PI*2,x=Math.sin(a)*(r-.2),z=Math.cos(a)*(r-.2);
      posts.push({x,y:2.44,z,w:.05,h:1.13,d:.05});
    }
    batch(g,rod,steel,posts,{metalness:.65});roundRail(g,r-.2,3.0);roundRail(g,r-.2,2.45);
    if(!isSludge){
      // Open annular effluent launder with sawtooth weir, separate from the settling water.
      ring(g,r-1.22,r-.61,.3,.18,colors.concrete);
      const launder=ring(g,r-1.17,r-.67,.66,.035,0x849c99);waterObjects.push(launder);
      ring(g,r-1.36,r-1.23,.18,.97,steel);
      const vertices=[],n=160,wr=r-1.38;
      for(let i=0;i<n;i++){
        const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2,m=(a+b)/2;
        const A=[Math.sin(a)*wr,1.22,Math.cos(a)*wr],B=[Math.sin(m)*wr,.96,Math.cos(m)*wr],C=[Math.sin(b)*wr,1.22,Math.cos(b)*wr];
        const D=[A[0],.84,A[2]],E=[C[0],.84,C[2]];
        vertices.push(...A,...D,...B,...B,...D,...E,...B,...E,...C);
      }
      const weirGeo=new THREE.BufferGeometry();weirGeo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));weirGeo.computeVertexNormals();
      const weir=new THREE.Mesh(weirGeo,material(0xa2aeae,{metalness:.6,side:THREE.DoubleSide,roughness:.42}));g.add(weir);
      ring(g,2.45,2.63,-1.6,2.9,0x8c9898); // Center inlet well, open at its top.
      cylinder(g,0,-1.4,0,.55,3.8,colors.concrete,24);
      const scraper=[];
      for(const s of [-1,1]){
        scraper.push(beam([0,-2.7,0],[s*(r-2),-2.85,0],.11));
        scraper.push(beam([0,-1.1,0],[s*(r-2),-2.85,0],.06));
        box(g,s*(r-2)/2,-2.86,0,r-2,.3,.2,darkSteel);
      }
      batch(g,rod,steel,scraper,{metalness:.5});
      box(g,r-1.9,1.1,1.3,1.2,.75,1.65,steel); // Scum collection box near the outlet side.
      line(g,[[2.7,1.25,1.3],[r-2.4,1.25,1.3]],steel,.055);
    }
    return bridge;
  }

  function site(scene,D) {
    const fixture=new THREE.Group();fixture.name='Local site construction details';scene.add(fixture);
    const posts=[],rails=[];
    const sides=[[-208,-138,208,-138],[-208,138,208,138],[208,-138,208,138],[-208,-138,-208,101],[-208,121,-208,138]];
    for(const [x1,z1,x2,z2] of sides){
      const len=Math.hypot(x2-x1,z2-z1),n=Math.ceil(len/6),dx=(x2-x1)/n,dz=(z2-z1)/n;
      for(let i=0;i<=n;i++)posts.push({x:x1+dx*i,y:1.32,z:z1+dz*i,w:.11,h:2.64,d:.11});
      for(const y of [.42,2.44])rails.push(beam([x1,y,z1],[x2,y,z2],.05));
    }
    batch(fixture,cube,darkSteel,posts,{metalness:.45,roughness:.57});batch(fixture,rod,darkSteel,rails,{metalness:.45});
    // Chain-link infill uses a procedural transparent material, no external image dependency.
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
    const ctx=canvas.getContext('2d');ctx.strokeStyle='#718080';ctx.lineWidth=2.5;
    for(let s=-128;s<=256;s+=32){ctx.beginPath();ctx.moveTo(s,0);ctx.lineTo(s+128,128);ctx.stroke();ctx.beginPath();ctx.moveTo(s,0);ctx.lineTo(s-128,128);ctx.stroke();}
    for(const [x1,z1,x2,z2] of sides){
      const len=Math.hypot(x2-x1,z2-z1),texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(len/2.1,1);
      const mesh=new THREE.Mesh(new THREE.PlaneGeometry(len,2.0),new THREE.MeshStandardMaterial({map:texture,color:0x6b7a78,transparent:true,alphaTest:.2,side:THREE.DoubleSide,roughness:.74}));
      mesh.position.set((x1+x2)/2,1.39,(z1+z2)/2);mesh.rotation.y=-Math.atan2(z2-z1,x2-x1);fixture.add(mesh);
    }
    // West service entrance, away from process tanks.
    for(const z of [101,121])box(fixture,-208,1.8,z,1.3,3.6,1.3,colors.concrete);
    const lamps=[];
    for(const z of [-92,88])for(const x of [-195,-107,25,94,146,196])lamps.push([x,z]);
    const poles=[],arms=[],heads=[],lights=[],feet=[];
    for(const [x,z] of lamps){
      feet.push({x,y:.18,z,w:.68,h:.36,d:.68});poles.push({x,y:3.15,z,w:.1,h:6.3,d:.1});
      arms.push(beam([x,6.2,z],[x+.9,6.48,z],.065));heads.push({x:x+1.02,y:6.44,z,w:.85,h:.19,d:.36});
      lights.push({x:x+1.02,y:6.33,z,w:.65,h:.025,d:.26});
    }
    batch(fixture,cube,colors.concrete,feet);batch(fixture,rod,steel,poles,{metalness:.7});batch(fixture,rod,steel,arms,{metalness:.7});
    batch(fixture,cube,darkSteel,heads);batch(fixture,cube,0xd6ded5,lights,{emissive:0xbec9b4,emissiveIntensity:.1,roughness:.4});
    const drains=[],slots=[];
    for(const x of [-108.3,32.2,147.2])for(const z of [-76,-38,0,38,76]){
      drains.push({x,y:.095,z,w:.64,h:.075,d:1.35});
      for(let k=-.5;k<=.5;k+=.2)slots.push({x,y:.14,z:z+k,w:.46,h:.045,d:.065});
    }
    batch(fixture,cube,darkSteel,drains,{metalness:.32,roughness:.8});batch(fixture,cube,0x969f9e,slots,{metalness:.5});
    const covers=[];
    for(const [x,z] of [[-111,-88],[-111,87],[29,-87],[29,87],[150,-88],[150,87]])covers.push({x,y:.105,z,w:.7,h:.065,d:.7});
    batch(fixture,new THREE.CylinderGeometry(1,1,1,24),0x515c5a,covers,{roughness:.81,metalness:.3});
    return fixture;
  }
  return {building,clarifier,site};
};
