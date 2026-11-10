/* Enfoque Mapa - mundo Three.js sem modelos, texturas, meshes ou assets importados. */
import * as T from "./three.module.js";
import {createCharacter} from "./character.js";
import {createBookshelf} from "./bookshelf.js";

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
 plant(g,-5.25,-3.85);plant(g,-5.0,3.5);
 const persons=def.people||[];
 const positions=[[0,-2.78],[-3.37,2.1],[3.45,2.1]];
 persons.forEach((p,i)=>{
   const [x,z]=positions[i]||[0,1.9]; // Allows more people in phase 2 by expanding positions later.
   const deskZ=i===0?-.85:3.15;
   const workstation=desk(g,x,deskZ,i===0,def.accent,idx?"infra":"os",i);
   workstation.userData.seatId=p.id;
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
  constructor({mount,onSelect,onFocus,onHover,onShelfChange}){
    this.mount=mount;this.onSelect=onSelect;this.onFocus=onFocus;this.onHover=onHover;this.onShelfChange=onShelfChange;
    this.scene=new T.Scene();this.scene.background=new T.Color("#1a313d");
    this.scene.fog=new T.FogExp2(0x1a313d,.009);
    this.camera=new T.PerspectiveCamera(48,1,.09,190);
    this.renderer=new T.WebGLRenderer({antialias:false,powerPreference:"low-power"});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1));
    this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;
    this.renderer.shadowMap.enabled=false;this.mount.appendChild(this.renderer.domElement);
    this.scene.add(new T.HemisphereLight(0xcfe6e4,0x385868,2.55));
    const sunlight=new T.DirectionalLight(0xffecd1,2.55);
    sunlight.position.set(-10,27,22);this.scene.add(sunlight);
    const bounce=new T.DirectionalLight(0xa1cde3,1.25);
    bounce.position.set(15,19,-12);this.scene.add(bounce);
    this.group=new T.Group();this.scene.add(this.group);
    box(this.group,42,.8,27.5,0x142734,2.1,-.9,0);
    box(this.group,41.8,.25,27.3,0x607b7d,2.1,-.48,0);
    this.commons=new T.Group();this.group.add(this.commons);
    const walk=beveled(this.commons,12,3.45,.11,0x688480,8.0,-.32,6.7);
    for(let i=-5;i<=5;i++)box(this.commons,.03,.012,3.25,0x789895,8+i*.9,-.225,6.7);
    const welcome=signSprite("ENFOQUE","CONTROL CENTER","#a6e5b9");
    welcome.position.set(8,.9,6.7);this.commons.add(welcome);
    this.rooms=new Map();this.actors=new Map();this.walls=[];
    this.shelf=null;this.lastShelfWheelAt=0;
    this.actorDefinitions=new Map();this.hidden=new Set();this.data=null;
    this.isolatedRoom=null;this.view="world";
    this.cameraState={yaw:.56,pitch:.52,distance:49,
      target:v(0,1.2,1.2),wanted:v(0,1.2,1.2),
      wantedYaw:.56,wantedPitch:.52,wantedDistance:49};
    this.pointer=new Map();this.dragging=false;this.dragDistance=0;
    this.lastX=0;this.lastY=0;this.dragMode="orbit";this.pinchDist=0;
    this.last=0;this.time=0;this.low=true;this.playing=true;this.raf=0;
    this.raycaster=new T.Raycaster();this.mouse=new T.Vector2();this.lastBookHover=null;
    this.dom=this.renderer.domElement;this.events();
    this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(mount);this.resize();
    this.loop(0);
  }

  setData(data){
    this.data=data;
    if(!this.rooms.size){
      for(const [idx,definition]of (data.rooms||[]).slice(0,2).entries()){
        const group=room(this.group,definition,idx,this.actors,this.walls);
        this.rooms.set(definition.id,group);
      }
      const os=this.rooms.get("enfoque-os");
      if(os){
        this.shelf=createBookshelf();
        os.add(this.shelf.root);
        this.shelf.onScroll(info=>this.onShelfChange?.(info));
      }
    }
    for(const r of data.rooms||[])for(const p of r.people||[]){
      this.actorDefinitions.set(p.id,{...p,roomId:r.id,roomName:r.name});
      this.actors.get(p.id)?.setStatus(p.status||"unknown");
    }
    this.shelf?.sync(data.computers||[],this.hidden);
    this.applyHidden();
  }

  setHidden(hidden){
    this.hidden=new Set(hidden||[]);
    this.applyHidden();
  }
  applyHidden(){
    for(const [id,actor]of this.actors)actor.root.visible=!this.hidden.has("person:"+id);
    this.shelf?.sync(this.data?.computers||[],this.hidden);
    if(this.view==="shelf" && (this.hidden.has("shelf:computadores")||this.hidden.has("room:enfoque-os"))){
      this.exitShelf();
    }
    if(this.shelf)this.shelf.root.visible=!this.hidden.has("shelf:computadores")
      && !this.hidden.has("room:enfoque-os")
      && (!this.isolatedRoom||this.isolatedRoom==="enfoque-os");
    this.applyRoomVisibility();
  }
  applyRoomVisibility(){
    for(const [id,g]of this.rooms){
      g.visible=!this.hidden.has("room:"+id)
        && (!this.isolatedRoom||id===this.isolatedRoom);
    }
    this.commons.visible=!this.isolatedRoom;
    // O cenário inteiro fica invisível durante a visita à estante.
    // A estante fica reparentada diretamente à cena 3D.
    this.group.visible=this.view!=="shelf";
  }
  reset(){
    const s=this.cameraState;
    s.wanted.set(0,1.2,1.2);s.wantedDistance=49;s.wantedYaw=.56;s.wantedPitch=.52;
  }
  isolateRoom(id){
    if(this.view==="shelf")this.exitShelf();
    this.isolatedRoom=id&&this.rooms.has(id)?id:null;
    this.applyRoomVisibility();
    if(this.isolatedRoom)this.focus("room",this.isolatedRoom);
    else this.reset();
  }
  enterShelf(){
    if(!this.shelf||this.hidden.has("shelf:computadores")||this.hidden.has("room:enfoque-os"))return;
    if(this.view==="shelf")return;
    this.view="shelf";
    this.isolatedRoom=null;
    // Só a estante é mantida na cena; paredes, mesas, personagens e piso somem.
    this.group.updateMatrixWorld(true);
    this.scene.attach(this.shelf.root);
    this.shelf.root.scale.setScalar(1);
    this.applyRoomVisibility();
    this.shelf.root.visible=true;
    const pt=this.shelf.root.getWorldPosition(new T.Vector3());
    const s=this.cameraState;
    s.wanted.copy(pt).add(v(0,2.85,0));
    s.wantedYaw=0;s.wantedPitch=.022;s.wantedDistance=this.shelfDistance();
    this.lastShelfWheelAt=0;
  }
  shelfDistance(){
    // Evita cortar as laterais em notebooks ou celulares com tela estreita.
    const aspect=Math.max(.45,this.camera.aspect);
    const radians=this.camera.fov*Math.PI/180;
    return Math.max(9.4,(7.85*.5)/(Math.tan(radians*.5)*aspect)*1.12);
  }
  exitShelf(){
    if(this.view!=="shelf")return;
    const os=this.rooms.get("enfoque-os");
    if(os&&this.shelf){
      this.scene.updateMatrixWorld(true);
      os.attach(this.shelf.root);
      this.shelf.root.position.set(3.45,0,-3.75);
      this.shelf.root.scale.setScalar(.57);
    }
    this.view="world";
    this.isolatedRoom=null;
    this.applyRoomVisibility();
    this.applyHidden();
    this.focus("room","enfoque-os");
  }
  focus(kind,id){
    if(kind==="shelf"||kind==="store"||kind==="computer"){
      this.enterShelf();return;
    }
    if(this.view==="shelf")this.exitShelf();
    if(kind==="room"){
      const group=this.rooms.get(id);if(!group)return;
      const pt=group.getWorldPosition(new T.Vector3());
      this.cameraState.wanted.copy(pt).add(v(0,1.2,0));
      this.cameraState.wantedDistance=21;
      return;
    }
    if(kind==="person"||kind==="seat"){
      const actor=this.actors.get(id);if(!actor)return;
      const pt=actor.root.getWorldPosition(new T.Vector3());
      this.cameraState.wanted.copy(pt).add(v(0,1.7,0));
      this.cameraState.wantedDistance=10;
    }
  }
  fov(val){
    this.camera.fov=Math.max(35,Math.min(70,Number(val)||48));
    this.camera.updateProjectionMatrix();
    if(this.view==="shelf")this.cameraState.wantedDistance=this.shelfDistance();
  }
  setQuality(high){this.low=!high;this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,high?1.4:1));this.resize();}
  resize(){
    const w=Math.max(this.mount.clientWidth,1),h=Math.max(this.mount.clientHeight,1);
    this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);
    if(this.view==="shelf")this.cameraState.wantedDistance=this.shelfDistance();
  }
  eventPick(e){
    if(!this.data)return null;
    const rect=this.dom.getBoundingClientRect();
    this.mouse.set((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height*2-1));
    this.raycaster.setFromCamera(this.mouse,this.camera);
    const targets=this.view==="shelf"?[this.shelf?.root].filter(Boolean):[this.group];
    const hits=this.raycaster.intersectObjects(targets,true);
    for(const hit of hits){
      let obj=hit.object;
      while(obj){
        const u=obj.userData;
        if(u.computerId)return{kind:"computer",id:u.computerId};
        if(u.storeId)return{kind:"store",id:u.storeId};
        if(u.personId)return{kind:"person",id:u.personId};
        if(u.seatId)return{kind:"seat",id:u.seatId};
        if(u.shelfTarget)return{kind:"shelf",id:"computadores"};
        if(u.roomId)return{kind:"room",id:u.roomId};
        obj=obj.parent;
      }
    }
    return null;
  }
  setHovered(item){
    if(!this.shelf)return;
    const id=item?.kind==="computer"?item.id:null;
    if(id===this.lastBookHover)return;
    this.lastBookHover=id;this.shelf.hover(id);
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
      if(!this.dragging||!this.pointer.has(e.pointerId)){
        if(e.pointerType==="mouse"){
          const pick=this.eventPick(e);this.setHovered(pick);this.onHover?.(pick,e.clientX,e.clientY);
        }
        return;
      }
      const dx=e.clientX-this.lastX,dy=e.clientY-this.lastY;
      this.lastX=e.clientX;this.lastY=e.clientY;this.dragDistance+=Math.abs(dx)+Math.abs(dy);
      if(this.pointer.size===2){
        this.pointer.get(e.pointerId).x=e.clientX;this.pointer.get(e.pointerId).y=e.clientY;
        const pts=[...this.pointer.values()],dist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
        if(this.view!=="shelf"&&this.pinchDist>0){
          this.cameraState.wantedDistance=Math.max(6,Math.min(85,this.cameraState.wantedDistance*this.pinchDist/dist));
        }
        this.pinchDist=dist;return;
      }
      if(this.view==="shelf")return; // Estante frontal: nenhuma rotação ou deslocamento.
      const s=this.cameraState;
      if(this.dragMode==="pan")this.pan(dx,dy);
      else{s.wantedYaw-=dx*.008;s.wantedPitch=Math.max(.12,Math.min(1.42,s.wantedPitch+dy*.006));}
    });
    canvas.addEventListener("pointerup",e=>{
      if(this.dragDistance<8&&this.pointer.size===1&&e.button!==2){
        const chosen=this.eventPick(e);
        if(chosen)this.onSelect?.(chosen);
      }
      this.pointer.delete(e.pointerId);
      if(this.pointer.size<2)this.pinchDist=0;
      this.dragging=this.pointer.size>0;
    });
    canvas.addEventListener("pointercancel",e=>{this.pointer.delete(e.pointerId);this.dragging=false;this.pinchDist=0;});
    canvas.addEventListener("dblclick",e=>{
      const item=this.eventPick(e);if(item){this.focus(item.kind,item.id);this.onFocus?.(item);}
    });
    canvas.addEventListener("wheel",e=>{
      e.preventDefault();
      if(this.view==="shelf"){
        const now=performance.now();
        if(now-this.lastShelfWheelAt>140){
          this.shelf?.scroll(e.deltaY);
          this.lastShelfWheelAt=now;
        }
        return;
      }
      const s=this.cameraState;s.wantedDistance=Math.max(6,Math.min(85,s.wantedDistance*(e.deltaY>0?1.09:.91)));
    },{passive:false});
  }
  pan(dx,dy){
    const s=this.cameraState;
    const right=v(Math.cos(s.yaw),0,-Math.sin(s.yaw));
    const forward=v(Math.sin(s.yaw),0,Math.cos(s.yaw));
    const amount=s.distance*.0017;
    s.wanted.addScaledVector(right,-dx*amount).addScaledVector(forward,-dy*amount);
    s.wanted.x=Math.max(-21,Math.min(22,s.wanted.x));
    s.wanted.z=Math.max(-16,Math.min(17,s.wanted.z));
  }
  wallsForCamera(){
    if(this.view==="shelf")return;
    const camera=this.camera.position;
    for(const wall of this.walls){
      const center=wall.parent.getWorldPosition(new T.Vector3());
      const a=wall.userData.axis;
      const fade=a==="z+"?camera.z>center.z+1:a==="z-"?camera.z<center.z-1:a==="x+"?camera.x>center.x+1:camera.x<center.x-1;
      wall.material.opacity+=((fade?.12:.80)-wall.material.opacity)*.14;
    }
  }
  loop(timeMs){
    if(!this.playing)return;
    this.raf=requestAnimationFrame(ms=>this.loop(ms));
    if(document.hidden||timeMs-this.last<(this.low?33:18))return;
    const dt=Math.min(.05,Math.max(.001,(timeMs-this.last)/1000));this.last=timeMs;this.time+=dt;
    const s=this.cameraState,blend=1-Math.exp(-dt*7.5);
    s.yaw+=(s.wantedYaw-s.yaw)*blend;s.pitch+=(s.wantedPitch-s.pitch)*blend;
    s.distance+=(s.wantedDistance-s.distance)*blend;s.target.lerp(s.wanted,blend);
    const cp=Math.cos(s.pitch),sp=Math.sin(s.pitch);
    this.camera.position.set(s.target.x+s.distance*cp*Math.sin(s.yaw),
      s.target.y+s.distance*sp,
      s.target.z+s.distance*cp*Math.cos(s.yaw));
    this.camera.lookAt(s.target);
    this.wallsForCamera();
    if(this.view!=="shelf")for(const actor of this.actors.values())if(actor.root.visible)actor.update(this.time);
    this.renderer.render(this.scene,this.camera);
  }
  dispose(){
    this.playing=false;cancelAnimationFrame(this.raf);this.ro.disconnect();
    this.shelf?.dispose();this.renderer.dispose();this.dom.remove();
  }
}
