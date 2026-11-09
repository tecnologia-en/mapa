/* Pets procedurais (cães/gatos): nenhum asset externo ou BoxGeometry no corpo.
   Um animal corresponde a um computador aprovado; pose = status real do agente. */
import * as THREE from "./three.module.js";

const palette = [
  {body:0xd9ad7b,ear:0xa16c4e,spot:0xffecd1},
  {body:0x81949b,ear:0x4a656e,spot:0xdbdee2},
  {body:0xc98a64,ear:0x7b5446,spot:0xf1d2a6},
  {body:0xefe5d1,ear:0xb7ad9b,spot:0x9e9c98},
  {body:0x544c55,ear:0x34303c,spot:0xc6b5b2},
  {body:0xc7bd9c,ear:0x94866d,spot:0xf2ebcc},
  {body:0x9d8baf,ear:0x625978,spot:0xded3e8}
];
const mat=(hex,roughness=.91)=>new THREE.MeshStandardMaterial({color:hex,roughness});
const sph=new THREE.SphereGeometry(1,13,9);
const ball=(g,material,x,y,z,a,b,c)=>{
  const m=new THREE.Mesh(sph,material);m.position.set(x,y,z);m.scale.set(a,b,c);g.add(m);return m;
};
const cap=(g,material,r,h,x,y,z)=>{
  const m=new THREE.Mesh(new THREE.CapsuleGeometry(r,h,4,9),material);
  m.position.set(x,y,z);g.add(m);return m;
};
const curve=(g,points,r,material)=>{
  const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const m=new THREE.Mesh(new THREE.TubeGeometry(c,12,r,6,false),material);
  g.add(m);return m;
};
function stableHash(id){let h=2166136261;for(const c of id){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0;}
function tagSprite(label){
  const canvas=document.createElement("canvas");canvas.width=512;canvas.height=128;
  const ctx=canvas.getContext("2d");
  const tx=new THREE.CanvasTexture(canvas);
  const obj=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,transparent:true,depthWrite:false,depthTest:false}));
  obj.scale.set(1.62,.43,1);
  function draw(status){
    const colors={online:"#a7edb5",offline:"#f3b79e",unknown:"#9fb3c2"};
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="rgba(18,39,45,.93)";ctx.beginPath();ctx.roundRect(5,4,502,116,20);ctx.fill();
    ctx.lineWidth=2;ctx.strokeStyle="rgba(201,235,224,.38)";ctx.stroke();
    ctx.fillStyle=colors[status]||colors.unknown;
    ctx.beginPath();ctx.arc(30,42,11,0,Math.PI*2);ctx.fill();
    ctx.textBaseline="middle";ctx.fillStyle="#eef7f3";ctx.font="bold 31px Segoe UI, sans-serif";
    ctx.textAlign="left";ctx.fillText(label.slice(0,20),53,43,429);
    ctx.fillStyle="#aec4bc";ctx.font="600 22px Segoe UI, sans-serif";
    ctx.fillText(status==="online"?"ONLINE · SENTADO":status==="offline"?"OFFLINE · DORMINDO":"SEM SINAL",24,91);
    tx.needsUpdate=true;
  }
  return {obj,draw};
}
export function createPet(data){
  const hash=stableHash(data.id);
  const species=hash%3===0?"cat":"dog";
  const pattern=palette[(hash>>>3)%palette.length];
  const main=mat(pattern.body),shadow=mat(pattern.ear),white=mat(pattern.spot);
  const nose=mat(0x32333e,.64),eyesMat=mat(0x2d3440,.32);
  const pet=new THREE.Group();pet.userData.petId=data.id;
  const rig=new THREE.Group();pet.add(rig);
  const oval=ball(rig,main,0,.72,-.08,.51,.51,.67);
  const belly=ball(rig,white,0,.61,.40,.31,.33,.22);
  const head=new THREE.Group();head.position.set(0,1.13,.42);rig.add(head);
  const skull=ball(head,main,0,.13,.12,.47,.46,.43);
  const muzzle=ball(head,white,0,-.09,.47,.30,.19,.18);
  ball(head,nose,0,-.03,.625,.105,.07,.07);
  // Tiny smile and whiskers; face with real pupils and glints.
  curve(head,[[-.14,-.16,.589],[0,-.19,.63],[.14,-.16,.589]],.012,shadow);
  for(const side of [-1,1]){
    ball(head,white,side*.19,.22,.488,.11,.14,.055);
    ball(head,eyesMat,side*.18,.21,.542,.068,.085,.03);
    ball(head,mat(0xffffff,.3),side*.20,.245,.568,.020,.027,.015);
  }
  const eyeParts=[];
  for(const mesh of head.children){
    if(mesh.isMesh&&Math.abs(Math.abs(mesh.position.x)-.19)<.025&&Math.abs(mesh.position.y-.22)<.025){
      eyeParts.push({mesh,base:mesh.scale.y});
    }
  }
  const ears=[];
  if(species==="cat"){
    for(const side of [-1,1]){
      const ear=new THREE.Group();ear.position.set(side*.31,.44,-.03);head.add(ear);
      const geom=new THREE.ConeGeometry(.23,.53,10,2);
      const e=new THREE.Mesh(geom,main);e.rotation.z=-side*.2;ear.add(e);
      const inner=new THREE.Mesh(new THREE.ConeGeometry(.13,.34,10),mat(0xd998a5));
      inner.position.z=.105;inner.position.y=.01;inner.rotation.z=-side*.2;ear.add(inner);ears.push(ear);
      for(let k=0;k<2;k++){
        const w=(k?1:-1);
        curve(head,[[side*.13,-.13,.57],[side*.23,-.14+w*.07,.64],[side*.43,-.13+w*.12,.56]],.009,shadow);
      }
    }
  }else{
    for(const side of [-1,1]){
      const ear=new THREE.Group();ear.position.set(side*.37,.28,0);head.add(ear);
      const flap=ball(ear,shadow,side*.11,.03,-.02,.19,.35,.16);flap.rotation.z=side*.37;ears.push(ear);
      ball(ear,main,side*.10,-.01,.08,.09,.20,.09);
    }
  }
  // Four rounded paws. Children animate to transition from sit to sleep.
  const legs=[];
  for(const side of [-1,1])for(const back of [false,true]){
    const pivot=new THREE.Group();pivot.position.set(side*.36,.46,back?-.42:.36);rig.add(pivot);
    const leg=cap(pivot,main,.115,.25,0,-.16,0);
    const paw=ball(pivot,white,0,-.37,.11,.17,.11,.24);
    legs.push({pivot,back,side});
  }
  const tail=new THREE.Group();tail.position.set(0,.82,-.66);rig.add(tail);
  if(species==="dog"){
    curve(tail,[[0,0,0],[.12,.20,-.27],[.25,.41,-.42]],.11,main);
    ball(tail,white,.25,.40,-.42,.13,.16,.14);
  }else{
    curve(tail,[[0,0,0],[.15,.11,-.36],[.48,.34,-.48],[.45,.6,-.43]],.095,shadow);
  }
  // Collar and a tiny metallic tag.
  const collar=new THREE.Mesh(new THREE.TorusGeometry(.31,.067,8,22),mat(0x70c3bd,.55));
  collar.rotation.x=Math.PI/2+.25;collar.position.set(0,-.24,.09);head.add(collar);
  ball(head,mat(0xe5c16e,.35),0,-.31,.43,.085,.10,.03);
  const indicator=ball(pet,mat(0x849ba9,.45),0,2.10,0,.075,.075,.075);
  indicator.material.emissive=new THREE.Color(0x688d9f);indicator.material.emissiveIntensity=.3;
  const tag=tagSprite(data.name||"Computador");tag.obj.position.set(0,2.58,0);pet.add(tag.obj);
  let status="unknown",transition=0,oldStatus="";
  function setStatus(s){
    status=["online","offline","unknown"].includes(s)?s:"unknown";
    if(status===oldStatus)return;
    oldStatus=status;
    const c=status==="online"?0x9aecb2:status==="offline"?0xf2a387:0x9aaab8;
    indicator.material.color.set(c);indicator.material.emissive.set(c);
    tag.draw(status);
  }
  function update(seconds){
    const offline=status==="offline",unknown=status==="unknown";
    const wanted=offline?1:unknown?.45:0;
    transition+=(wanted-transition)*.16;
    // Online = sitting with alert head; offline = curled up, eyes closed.
    rig.position.y= -.42*transition+(offline?.018*Math.sin(seconds*.7):.024*Math.sin(seconds*1.6+(hash%9)));
    rig.rotation.x= .62*transition;
    rig.rotation.z= .13*transition;
    head.rotation.z=transition*.19+Math.sin(seconds*.8+hash)*.04;
    head.rotation.x= -.13*transition;
    oval.scale.z=.67+transition*.18;
    for(const a of legs){
      a.pivot.rotation.x=(a.back?-.40:.07)*transition;
      a.pivot.position.y=.46-transition*.16;
    }
    tail.rotation.y=offline?0:Math.sin(seconds*2.5+hash)*.22;
    tail.rotation.z=offline?-.25:Math.sin(seconds*1.7+hash)*.11;
    for(const e of ears)e.rotation.z=Math.sin(seconds*.9+hash)*.04;
    // Blink by scaling the eye whites, without polling any PC.
    const blink=(seconds+(hash%7))%5.5;
    const blinkFactor=offline?.13:(blink>5.36?.15:1);
    for(const eye of eyeParts)eye.mesh.scale.y=eye.base*blinkFactor;
  }
  setStatus(data.status);
  const dispose=()=>{
    pet.traverse(o=>{
      if(o.geometry) o.geometry.dispose();
      const mats=Array.isArray(o.material)?o.material:[o.material];
      for(const material of mats)if(material){material.map?.dispose();material.dispose();}
    });
  };
  return {root:pet,setStatus,update,dispose,species};
}
