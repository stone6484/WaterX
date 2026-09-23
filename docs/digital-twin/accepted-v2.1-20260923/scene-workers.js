/* Selectable example staff; identities and work locations come from personnel.js. */
window.WaterXWorkers=function(T,parent,people){
 const groups=new Map();
 const materials=new Map();const mat=c=>{if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.8,metalness:.02}));return materials.get(c);};
 function mesh(g,geo,color,x,y,z){const m=new T.Mesh(geo,mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
 function box(g,x,y,z,w,h,d,c){return mesh(g,new T.BoxGeometry(w,h,d),c,x,y,z);}
 function limb(g,a,b,r,c,r2=r){const v=new T.Vector3(...a),w=new T.Vector3(...b).sub(v);const m=mesh(g,new T.CylinderGeometry(r,r2,w.length(),10),c,...v.addScaledVector(w,.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),w.normalize());return m;}
 function ball(g,x,y,z,r,c){return mesh(g,new T.SphereGeometry(r,14,10),c,x,y,z);}
 function person(p){const {x,y,z,angle}=p,job=p.roleId==='maintenance'?'维保':p.role;const g=new T.Group();g.position.set(x,y,z);g.rotation.y=angle;g.userData.role=job;g.userData.id=p.id;groups.set(p.id,g);parent.add(g);const uniform=0x284d62,vest=job==='维保'?0xe88430:0xc6ce46,skin=0xbb9477,reflect=0xd9e2da;
  for(const side of [-1,1]){const xx=side*.115;box(g,xx,.07,.055,.17,.14,.32,0x263036);limb(g,[xx,.17,0],[xx,.54,-.025],.073,uniform,.085);limb(g,[xx,.54,-.025],[side*.105,.94,0],.092,uniform,.085);box(g,xx,.40,.075,.13,.045,.015,reflect);}
  const torso=mesh(g,new T.CylinderGeometry(.225,.18,.48,12),uniform,0,1.16,0);torso.scale.z=.66;
  for(const side of [-1,1]){box(g,side*.115,1.2,.128,.18,.43,.032,vest);box(g,side*.115,1.2,-.128,.18,.43,.032,vest);box(g,side*.115,1.11,.151,.18,.05,.015,reflect);box(g,side*.115,1.31,.151,.04,.17,.015,reflect);}
  limb(g,[0,1.38,0],[0,1.47,0],.063,skin);const head=ball(g,0,1.55,0,.123,skin);head.scale.set(.86,1.14,.91);ball(g,0,1.55,.108,.025,skin);
  mesh(g,new T.SphereGeometry(.141,18,12,0,Math.PI*2,0,Math.PI/2),0xf3cf4b,0,1.61,0);const brim=mesh(g,new T.CylinderGeometry(.166,.166,.032,20),0xf3cf4b,0,1.61,.015);brim.scale.z=.91;box(g,0,1.745,.0,.035,.014,.16,0xffe78a);
  const tablet=job!=='维保';for(const side of [-1,1]){const shoulder=[side*.24,1.34,0],elbow=[side*.31,tablet?1.11:1.03,tablet?.12:0],hand=[side*(tablet?.17:.28),tablet?1.14:.86,tablet?.30:.06];limb(g,shoulder,elbow,.072,uniform,.084);ball(g,...elbow,.074,uniform);limb(g,elbow,hand,.058,uniform,.068);ball(g,...hand,.06,0xbcc4bb);}
  if(tablet){const t=box(g,0,1.15,.32,.30,.21,.035,0x25353c);t.rotation.x=-.35;const display=box(g,0,1.155,.34,.26,.16,.01,0x759d9b);display.rotation.x=-.35;}
  else{box(g,.30,.68,.06,.30,.24,.16,0x53646b);limb(g,[.20,.81,.06],[.20,.87,.06],.016,0x26343b);limb(g,[.40,.81,.06],[.40,.87,.06],.016,0x26343b);limb(g,[.20,.87,.06],[.40,.87,.06],.016,0x26343b);}
 }
 people.filter(p=>p.onSite).forEach(person);return groups;
};
