/* Enfoque Mapa - mundo Three.js sem modelos, texturas, meshes ou assets importados. */
import * as T from "./three.module.js";
import {createCharacter} from "./character.js";

const colors={floor:0x193644,wall:0xc4d2c8,beige:0xe9dcc0,muted:0x8fa7ad,steel:0x5d7181,wood:0x987b5f,trim:0x546b6c};
const color=x=>new T.Color(x);
const v=(x,y,z)=>new T.Vector3(x,y,z);
const random=(seed)=>{let x=seed;return()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296;}};
const m=(c,roughness=.85,metalness=0,extra={})=>new T.MeshStandardMaterial({color:c,roughness,metalness,...extra});
const primitive={
 sphere:new T.SphereGeometry(1,16,12),
 cylinder:new T.CylinderGeometry(1,1,1,14),
 plane:new T.PlaneGeometry(1,1)
};
function mesh(geo,material,parent,x=0,y=0,z=0){
  const obj=new T.Mesh(geo,material);obj.position.set(x,y,z);parent.add(obj);return obj;
}
function box(g,w,h,d,c,x=0,y=0,z=0,material=null){
  return mesh(new T.BoxGeometry(w,h,d),material||m(c),g,x,y,z);
}
function cyl(g,top,bottom,height,c,x=0,y=0,z=0,material=null){
  return mesh(new T.CylinderGeometry(top,bottom,height,16),material||m(c),g,x,y,z);
}
function orb(g,c,x,y,z,sx,sy,sz){const a=mesh(primitive.sphere,m(c),g,x,y,z);a.scale.set(sx,sy,sz);return a;}
function roundedRectShape(w,h,r){
 const s=new T.Shape(),x=-w/2,y=-h/2;
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
 s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
 s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
 s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
}
function beveled(g,w,d,h,c,x=0,y=0,z=0){
 const shape=roundedRectShape(w,d,Math.min(w,d)*.12);
 const geo=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:true,bevelThickness:.055,bevelSize:.07,bevelSegments:3,curveSegments:8});
 geo.rotateX(-Math.PI/2);
 return mesh(geo,m(c,.68),g,x,y,z);
}
function canvasTexture(draw,w=256,h=256){
 const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d");
 draw(ctx,w,h);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;return tex;
}
function floorTexture(type){
 const r=random(type==="wood"?137:1426);
 return canvasTexture((ctx,w,h)=>{
   ctx.fillStyle=type==="wood"?"#8f765f":"#8b9ba2";ctx.fillRect(0,0,w,h);
   if(type==="wood"){
     for(let row=0;row<10;row++){
       const yy=row*25.6;ctx.fillStyle=row%2?"#9b806a":"#8a745d";ctx.fillRect(0,yy,w,25.6);
       ctx.strokeStyle="rgba(45,32,26,.26)";ctx.lineWidth=2;ctx.strokeRect(0,yy,w,25.6);
       for(let i=0;i<60;i++){const xx=r()*w,y=yy+r()*25;ctx.fillStyle="rgba(52,29,12,.05)";ctx.fillRect(xx,y,30+r()*45,.6);}
     }
   }else{
     ctx.fillStyle="#87969f";ctx.fillRect(0,0,w,h);
     for(let x=0;x<w;x+=42)for(let y=0;y<h;y+=42){
       ctx.fillStyle=r()>.5?"#889fa5":"#8fa4ab";ctx.fillRect(x+1,y+1,40,40);
       ctx.strokeStyle="rgba(28,43,49,.23)";ctx.strokeRect(x+.5,y+.5,41,41);
     }
   }
 },256,256);
}
function signSprite(title,subtitle,accent){
 const canvas=document.createElement("canvas");canvas.width=760;canvas.height=176;const ctx=canvas.getContext("2d");
 ctx.fillStyle="rgba(24,40,46,.93)";ctx.beginPath();ctx.roundRect(8,10,744,148,26);ctx.fill();
 ctx.lineWidth=3;ctx.strokeStyle=accent;ctx.stroke();ctx.textAlign="center";
 ctx.fillStyle="#f6f7ee";ctx.font="800 52px Segoe UI, sans-serif";ctx.fillText(title,380,80,680);
 ctx.fillStyle="#acc2bd";ctx.font="600 25px Segoe UI, sans-serif";ctx.fillText(subtitle,380,124,680);
 const tx=new T.CanvasTexture(canvas);tx.colorSpace=T.SRGBColorSpace;
 const s=new T.Sprite(new T.SpriteMaterial({map:tx,transparent:true,depthWrite:false,depthTest:false}));s.scale.set(5.8,1.34,1);return s;
}
function monitorTexture(kind,accent,index){
 return canvasTexture((ctx,w,h)=>{
   ctx.fillStyle="#14252d";ctx.fillRect(0,0,w,h);ctx.fillStyle="#24414b";ctx.fillRect(8,8,w-16,23);
   ctx.fillStyle=accent;ctx.fillRect(16,17,44,5);ctx.fillStyle="#829fa6";
   for(let i=0;i<4;i++)ctx.fillRect(18,50+i*22,40+i*18,7);
   if(kind==="infra"){
     for(let i=0;i<3;i++){ctx.fillStyle=i===2?"#d5b47a":"#7fbfb0";ctx.fillRect(135,50+i*29,90,18);}
   }else{
     ctx.strokeStyle="#7ec8ae";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(120,155);
     for(let i=0;i<12;i++)ctx.lineTo(120+i*10,116-Math.sin(i*.6)*28);ctx.stroke();
   }
   ctx.fillStyle="#91dfbc";ctx.beginPath();ctx.arc(23,225,6,0,Math.PI*2);ctx.fill();
 });
}
function computer(g,x,z,accent,kind,index){
 const group=new T.Group();group.position.set(x,0,z);g.add(group);
 const monitor=box(group,1.25,.82,.12,0x263e48,0,1.91,-.22);
 box(group,1.13,.68,.018,0x112732,0,1.91,-.145,new T.MeshStandardMaterial({map:monitorTexture(kind,accent,index),emissive:0x273b35,emissiveIntensity:.16}));
 box(group,.12,.23,.14,0x728687,0,1.45,-.22);
 beveled(group,.5,.3,.05,0x657d7d,0,1.40,-.21);
 beveled(group,.86,.30,.04,0x6a8190,0,1.43,.39);
 for(let i=0;i<4;i++)for(let j=0;j<2;j++)box(group,.15,.011,.11,0xb1c5c4,-.3+i*.20,1.485,.34+j*.13);
 orb(group,0x293b45,.68,1.45,.36,.13,.045,.18);
 return group;
}
function desk(g,x,z,chief,accent,kind,index){
 const table=new T.Group();table.position.set(x,0,z);g.add(table);
 const w=chief?3.75:2.95,d=chief?1.65:1.35;
 beveled(table,w,d,.16,chief?0x9f7f66:0x9f8d7c,0,1.36,0);
 for(const xside of [-1,1])for(const zside of [-1,1]){
   cyl(table,.085,.085,1.32,0x5a6869,xside*(w/2-.22),.67,zside*(d/2-.19));
 }
 beveled(table,w-.25,.10,.04,0x567a74,0,1.32,-d/2+.16);
 computer(table,0,0,accent,kind,index);
 cyl(table,.14,.17,.06,0xcfded5,-w*.31,1.45,.38);
 cyl(table,.12,.12,.28,0xd4ebdd,-w*.31,1.60,.38);
 orb(table,0xe8eadf,-w*.31,1.76,.38,.13,.02,.13);
 if(chief){
   const sign=beveled(table,1.18,.4,.08,0x44585e,w*.27,1.49,.38);
   box(table,.88,.11,.04,0xe0ce9d,w*.27,1.55,.36);
   for(let i=0;i<3;i++)orb(table,0xcab59e,w*.27-.2+i*.20,1.65,.37,.06,.03,.04);
 }
 const chair=new T.Group();chair.position.set(0,0,1.12);g.add(chair);
 beveled(chair,1.1,1.04,.17,0x526975,0,.80,0);
 const back=beveled(chair,1.04,.19,1.01,chief?0x486779:0x607b87,0,.94,-.45);
 for(const side of [-1,1])cyl(chair,.07,.07,.83,0x5c7480,side*.38,.40,0);
 return table;
}
function plant(g,x,z){
 const group=new T.Group();group.position.set(x,0,z);g.add(group);
 cyl(group,.39,.31,.54,0xa9a392,0,.3,0);
 cyl(group,.27,.24,.15,0x63795a,0,.59,0);
 for(let k=0;k<8;k++){
  const a=k*Math.PI/4;const ax=Math.cos(a)*.32,az=Math.sin(a)*.32;
  const stem=new T.CatmullRomCurve3([v(0,.56,0),v(ax*.48,1.1,az*.48),v(ax,1.53+(k%2)*.12,az)]);
  mesh(new T.TubeGeometry(stem,10,.025,6,false),m(0x49735e),group);
  const leaf=orb(group,k%3?0x56936c:0x88ad6a,ax,1.4+(k%2)*.14,az,.19,.38,.13);leaf.rotation.z=Math.sin(a)*-.34;
 }
}
function bookshelf(g,x,z){
 const shelf=new T.Group();shelf.position.set(x,0,z);g.add(shelf);
 for(const h of [.35,1.17,2.0,2.8])beveled(shelf,2.15,.48,.09,0x8e8069,0,h,0);
 for(const xx of [-1.0,1.0])box(shelf,.11,2.85,.48,0x6c7166,xx,1.43,0);
 const r=random(45);
 for(let i=0;i<16;i++){
   const h=[.43,1.25,2.1][i%3],x=-.83+Math.floor(i/3)*.28;
   box(shelf,.12,.30+r()*.23,.32,[0x8cb2a4,0xba9b86,0x8898b9,0xd9ae75][i%4],x,h+.2,.04);
 }
}
function wallWithDoor(g,x,y,z,w,d,orientation,colorMaterial){
 const obj=box(g,w,3.7,d,0,x,y,z,colorMaterial.clone());
 obj.userData.isWall=true;obj.userData.axis=orientation;obj.raycast=()=>{};return obj;
}
function room(group,def,idx,actorMap,walls){
 const g=new T.Group();g.position.set(idx===0?-8.2:8.2,0,-1);g.userData.roomId=def.id;group.add(g);
 const roomW=13.25,roomD=11.25,roomY=.18;
 const slab=box(g,roomW,.42,roomD,0x425664,0,-.28,0);
 const tx=floorTexture(def.floor||"wood");tx.repeat.set(3,3);
 box(g,roomW,.09,roomD,0xffffff,0,-.035,0,new T.MeshStandardMaterial({map:tx,roughness:.92}));
 // Rug soft rectangular textile.
 const rug=beveled(g,5.7,4.0,.025,idx===0?0x526b82:0x587c75,0,.04,.2);rug.material.roughness=1;
 // Walls with volume and contrasting baseboards.
 const material=m(0xc7d6d2,.95,0,{transparent:true,opacity:.94,depthWrite:false});
 const wallBack=wallWithDoor(g,0,1.9,-roomD/2,roomW,.30,"z-",material);walls.push(wallBack);
 const wallLeft=wallWithDoor(g,-roomW/2,1.9,0,.30,roomD,"x-",material);walls.push(wallLeft);
 const wallRight=wallWithDoor(g,roomW/2,1.9,0,.30,roomD,"x+",material);walls.push(wallRight);
 // Front entrance: frame around a door opening plus glass panels.
 const frontMat=m(0xb7c8c2,.92,0,{transparent:true,opacity:.75,depthWrite:false});
 const fw=roomW/2-1.38;
 const frontA=wallWithDoor(g,-(roomW-fw)/2,1.9,roomD/2,fw,.25,"z+",frontMat);
 const frontB=wallWithDoor(g,(roomW-fw)/2,1.9,roomD/2,fw,.25,"z+",frontMat);
 walls.push(frontA,frontB);
 box(g,2.9,.42,.25,0x9faeaa,0,3.59,roomD/2);
 for(const zside of [-1,1]){
   for(const px of [-roomW/2+.18,roomW/2-.18])
     box(g,.11,.32,roomD-.4,0x879b93,px,.16,0);
 }
 for(let i=-1;i<=1;i++){
   const xx=i*3.0;
   box(g,1.3,1.5,.06,0x536f74,xx,2.2,-roomD/2+.23);
   const glass=box(g,1.12,1.31,.045,0x86cad1,xx,2.2,-roomD/2+.19,m(0x8dbec3,.25,.08,{transparent:true,opacity:.60,depthWrite:false}));
   box(g,1.3,.08,.13,0xd9ddd0,xx,1.42,-roomD/2+.20);
 }
 // Art frames / wall labels.
 box(g,2.75,1.55,.11,0x55717a,-4.3,2.05,-roomD/2+.28);
 box(g,2.45,1.26,.02,idx===0?0x8f82b3:0x7bb0a6,-4.3,2.05,-roomD/2+.34);
 for(let i=0;i<4;i++){
   cyl(g,.07,.07,.55,0xdedac8,-5.3+i*.6,2.05+(i%2)*.1,-roomD/2+.40);
 }
 const sign=signSprite(def.name,idx===0?"SISTEMA OPERACIONAL":"SERVIÇOS COMPARTILHADOS",def.accent);
 sign.position.set(0,5.0,-roomD/2+.2);g.add(sign);
 // Ceiling-free warm lamps: no occlusion of the camera.
 for(const xx of [-3.2,3.2]){
   cyl(g,.41,.28,.18,0xe1dbc5,xx,3.65,-1.1);
   const gl=orb(g,0xffdfb2,xx,3.49,-1.1,.38,.08,.38);
   gl.material.emissive=new T.Color(0xf7c790);gl.material.emissiveIntensity=.36;
 }
 bookshelf(g,-5.1,-2.45);plant(g,5.35,-3.58);plant(g,-5.0,3.5);
 const persons=def.people||[];
 const positions=[[0,-2.78],[-3.37,2.1],[3.45,2.1]];
 persons.forEach((p,i)=>{
   const [x,z]=positions[i]||[0,1.9]; // Allows more people in phase 2 by expanding positions later.
   const deskZ=i===0?-.85:3.15;
   desk(g,x,deskZ,i===0,def.accent,idx?"infra":"os",i);
   const character=createCharacter(T,p,{index:i+idx*3});
   character.root.position.set(x,0,z);
   character.root.rotation.y=.06;
   g.add(character.root);actorMap.set(p.id,character);
   character.setStatus(p.status||"unknown");
 });
 // Room floor clickable and label.
 slab.userData.roomId=def.id;
 return g;
}
export class World {
  constructor({mount,onSelect,onFocus,onHover}){
    this.mount=mount;this.onSelect=onSelect;this.onFocus=onFocus;this.onHover=onHover;
    this.scene=new T.Scene();this.scene.background=new T.Color("#1c3442");
    this.scene.fog=new T.FogExp2(0x1c3442,.011);
    this.camera=new T.PerspectiveCamera(48,1,.09,135);this.camera.position.set(18,27,32);
    this.renderer=new T.WebGLRenderer({antialias:false,powerPreference:"low-power"});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1));this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.20;
    this.renderer.shadowMap.enabled=false;mount.appendChild(this.renderer.domElement);
    this.ambient=new T.HemisphereLight(0xc9e8e5,0x3b6170,2.55);this.scene.add(this.ambient);
    const key=new T.DirectionalLight(0xffe8c4,2.55);key.position.set(-10,25,17);this.scene.add(key);
    const fill=new T.DirectionalLight(0x9cceef,1.4);fill.position.set(10,18,-15);this.scene.add(fill);
    const group=new T.Group();this.scene.add(group);this.group=group;
    box(group,32.0,.8,21.9,0x0f2733,0,-.91,-.8);
    box(group,31.9,.24,21.7,0x698584,0,-.49,-.8);
    // Central connection corridor and reception.
    const corridor=beveled(group,30.2,3.45,.10,0x69817b,0,-.33,6.7);
    for(let i=-5;i<=5;i++){const a=box(group,.025,.009,3.18,0x89a3a0,i*2.5,-.205,6.7);a.material.roughness=.9;}
    const plaque=beveled(group,4.4,1.0,.12,0x315967,0,-.18,6.67);
    const sign=signSprite("ENFOQUE","CONTROL CENTER", "#a6e5b9");sign.position.set(0,.75,6.7);group.add(sign);
    this.rooms=new Map();this.actors=new Map();this.walls=[];
    this.actorDefinitions=new Map();
    this.cameraState={yaw:.55,pitch:.65,distance:41,target:v(0,0,0),wanted:v(0,0,0),wantedYaw:.55,wantedPitch:.65,wantedDistance:41,
     velocityYaw:0,velocityPitch:0,panVelocity:v(0,0,0)};
    this.pointer=new Map();this.dragging=false;this.dragDistance=0;this.lastX=0;this.lastY=0;this.dragMode="orbit";
    this.pinchDist=0;this.selected=null;this.time=0;this.last=0;this.playing=true;this.low=true;this.animId=null;
    this.raycaster=new T.Raycaster();this.mouse=new T.Vector2();
    this.dom=this.renderer.domElement;this.events();this.resize();
    this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(this.mount);
    this.loop(0);
  }
  setData(data){
    this.data=data;if(!this.rooms.size){
      const defs=data.rooms?.slice(0,2)||[];
      defs.forEach((r,index)=>{this.rooms.set(r.id,room(this.group,r,index,this.actors,this.walls));});
      this.initialized=true;
    }
    for(const r of data.rooms||[])for(const p of r.people||[]){
      this.actorDefinitions.set(p.id,{...p,roomId:r.id,roomName:r.name});
      const a=this.actors.get(p.id);if(a)a.setStatus(p.status||"unknown");
    }
    this.focusRoom=null;
  }
  findRoom(id){return this.data?.rooms?.find(r=>r.id===id);}
  fov(val){this.camera.fov=Math.max(35,Math.min(70,Number(val)||48));this.camera.updateProjectionMatrix();}
  setQuality(high){this.low=!high;this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,high?1.4:1.0));this.resize();}
  reset(){const s=this.cameraState;s.wanted.set(0,0,0);s.wantedYaw=.55;s.wantedPitch=.65;s.wantedDistance=41;this.selected=null;}
  focus(kind,id){
    const s=this.cameraState;
    if(kind==="room"){
      const room=this.rooms.get(id);if(!room)return;
      s.wanted.set(room.position.x,1.0,room.position.z);s.wantedDistance=22;
    }else{
      const actor=this.actors.get(id);if(!actor)return;
      const pos=new T.Vector3();actor.root.getWorldPosition(pos);
      s.wanted.copy(pos).add(v(0,1.7,0));s.wantedDistance=10.2;
    }
  }
  resize(){const width=Math.max(this.mount.clientWidth,1),height=Math.max(this.mount.clientHeight,1);
    this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.renderer.setSize(width,height,false);}
  eventPick(e){
    const rect=this.dom.getBoundingClientRect();
    this.mouse.set((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height*2-1));
    this.raycaster.setFromCamera(this.mouse,this.camera);
    const hits=this.raycaster.intersectObjects([this.group],true);
    for(const h of hits){
      let obj=h.object;
      while(obj){
        if(obj.userData.personId)return{kind:"person",id:obj.userData.personId};
        if(obj.userData.roomId)return{kind:"room",id:obj.userData.roomId};
        obj=obj.parent;
      }
    }
    return null;
  }
  events(){
    const canvas=this.dom;
    canvas.addEventListener("contextmenu",e=>e.preventDefault());
    canvas.addEventListener("pointerdown",e=>{
      this.pointer.set(e.pointerId,{x:e.clientX,y:e.clientY});
      this.dragging=true;this.dragDistance=0;this.lastX=e.clientX;this.lastY=e.clientY;
      this.dragMode=e.button===2||e.shiftKey?"pan":"orbit";
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove",e=>{
      if(!this.dragging||!this.pointer.has(e.pointerId)){if(this.onHover&&e.pointerType==="mouse")this.onHover(this.eventPick(e));return;}
      const dx=e.clientX-this.lastX,dy=e.clientY-this.lastY;this.lastX=e.clientX;this.lastY=e.clientY;
      this.dragDistance+=Math.abs(dx)+Math.abs(dy);
      const s=this.cameraState;
      if(this.pointer.size===2){
        this.pointer.get(e.pointerId).x=e.clientX;this.pointer.get(e.pointerId).y=e.clientY;
        const arr=[...this.pointer.values()],dist=Math.hypot(arr[0].x-arr[1].x,arr[0].y-arr[1].y);
        if(this.pinchDist>0)s.wantedDistance=Math.max(7,Math.min(69,s.wantedDistance*this.pinchDist/dist));
        this.pinchDist=dist;
        return;
      }
      if(this.dragMode==="pan")this.pan(dx,dy);
      else{s.wantedYaw-=dx*.009;s.wantedPitch=Math.max(.14,Math.min(1.35,s.wantedPitch+dy*.007));}
    });
    canvas.addEventListener("pointerup",e=>{
      if(this.dragDistance<7&&this.pointer.size===1&&e.button!==2){const picked=this.eventPick(e);if(picked)this.onSelect?.(picked);}
      this.pointer.delete(e.pointerId);if(this.pointer.size<2)this.pinchDist=0;
      this.dragging=this.pointer.size>0;
    });
    canvas.addEventListener("pointercancel",e=>{this.pointer.delete(e.pointerId);this.dragging=false;this.pinchDist=0;});
    canvas.addEventListener("dblclick",e=>{const p=this.eventPick(e);if(p){this.focus(p.kind,p.id);this.onFocus?.(p);}});
    canvas.addEventListener("wheel",e=>{e.preventDefault();const s=this.cameraState;s.wantedDistance=Math.max(7,Math.min(69,s.wantedDistance*(e.deltaY>0?1.09:.91)));},{passive:false});
  }
  pan(dx,dy){
    const s=this.cameraState,y=s.yaw;
    const right=v(Math.cos(y),0,-Math.sin(y));
    const forward=v(Math.sin(y),0,Math.cos(y));
    const amount=s.distance*.00175;
    s.wanted.addScaledVector(right,-dx*amount).addScaledVector(forward,-dy*amount);
    s.wanted.x=Math.max(-18,Math.min(18,s.wanted.x));s.wanted.z=Math.max(-12,Math.min(12,s.wanted.z));
  }
  wallsForCamera(){
    const cam=this.camera.position;
    for(const wall of this.walls){
      const parent=wall.parent;
      const center=parent.getWorldPosition(new T.Vector3());
      const a=wall.userData.axis;
      let fade=false;
      if(a==="z+")fade=cam.z>center.z+1;
      else if(a==="z-")fade=cam.z<center.z-1;
      else if(a==="x+")fade=cam.x>center.x+1;
      else if(a==="x-")fade=cam.x<center.x-1;
      wall.material.opacity+=( (fade?.13:.87)-wall.material.opacity)*.13;
    }
  }
  highlight(kind,id){
    for(const [aid,a]of this.actors){const f=kind==="person"&&aid===id;a.root.scale.setScalar(f?1.055:1);}
  }
  loop(ms){
    if(!this.playing)return;
    this.animId=requestAnimationFrame(t=>this.loop(t));
    if(document.hidden)return;
    if(ms-this.last<(this.low?33:17))return;
    const delta=Math.min(.05,Math.max(0,(ms-this.last)/1000));this.last=ms;this.time+=delta;
    const s=this.cameraState,damp=1-Math.exp(-delta*8);
    s.yaw+=(s.wantedYaw-s.yaw)*damp;s.pitch+=(s.wantedPitch-s.pitch)*damp;
    s.distance+=(s.wantedDistance-s.distance)*damp;s.target.lerp(s.wanted,damp);
    const radius=s.distance,cp=Math.cos(s.pitch),sp=Math.sin(s.pitch);
    this.camera.position.set(s.target.x+radius*cp*Math.sin(s.yaw),s.target.y+radius*sp,s.target.z+radius*cp*Math.cos(s.yaw));
    this.camera.lookAt(s.target);
    this.wallsForCamera();
    for(const a of this.actors.values())a.update(this.time);
    this.renderer.render(this.scene,this.camera);
  }
  dispose(){this.playing=false;cancelAnimationFrame(this.animId);this.ro.disconnect();this.renderer.dispose();this.dom.remove();}
}
