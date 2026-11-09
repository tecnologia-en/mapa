/* Andar 2 — Intranet: departamentos e páginas reais, em cenário procedural leve.
 * Cada funcionário corresponde a uma rota HTML existente. Não modifica a intranet.
 */
import * as T from "./three.module.js";

const G={
 box:new T.BoxGeometry(1,1,1),
 sphere:new T.SphereGeometry(1,11,8),
 capsule:new T.CapsuleGeometry(1,.5,4,8)
};
const m=(c,r=.88)=>new T.MeshStandardMaterial({color:c,roughness:r});
const floorMat=m(0x5a777d),wallMat=m(0xa9cac5),beamMat=m(0x6d8c89),deskMat=m(0xb2a18c),legMat=m(0x526c75);
const monitorMat=m(0x263d49),screenMat=m(0x73aeac,.4),skinMats=[0xdab08f,0xa57e63,0xe3c2a5,0xc39677,0x97715e].map(x=>m(x));
const hairMats=[0x2d333a,0x514036,0x30313b,0x725b48].map(x=>m(x));
const coatMats=[0xb0a1df,0x79bca2,0xd7ae7f,0x7fb6cd,0xd2a3b9,0xa5b6bd,0x9cb89d,0xc6b88c].map(x=>m(x));
const sharedMaterials=[floorMat,wallMat,beamMat,deskMat,legMat,monitorMat,screenMat,...skinMats,...hairMats,...coatMats];

function piece(parent,geometry,material,x,y,z,a=1,b=1,c=1){
 const mesh=new T.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.scale.set(a,b,c);parent.add(mesh);return mesh;
}
function cube(g,mat,x,y,z,a,b,c){return piece(g,G.box,mat,x,y,z,a,b,c);}
function oval(g,mat,x,y,z,a,b,c){return piece(g,G.sphere,mat,x,y,z,a,b,c);}
function label(text,subtitle="#",accent="#9fdaba"){
 const canvas=document.createElement("canvas");canvas.width=740;canvas.height=162;
 const ctx=canvas.getContext("2d");ctx.fillStyle="rgba(22,43,50,.95)";
 ctx.beginPath();ctx.roundRect(7,8,726,146,23);ctx.fill();ctx.strokeStyle=accent;ctx.lineWidth=3;ctx.stroke();
 ctx.fillStyle="#edf6f2";ctx.textAlign="center";ctx.font="bold 51px Segoe UI,Arial";
 ctx.fillText(String(text).slice(0,38),370,81,650);
 ctx.fillStyle="#b9cfd0";ctx.font="600 23px Segoe UI,Arial";ctx.fillText(subtitle,370,120,635);
 const tx=new T.CanvasTexture(canvas);tx.colorSpace=T.SRGBColorSpace;
 const spr=new T.Sprite(new T.SpriteMaterial({map:tx,transparent:true,depthWrite:false}));
 spr.scale.set(5.2,1.13,1);return spr;
}
function desk(parent,page,coat,index){
 const root=new T.Group();root.userData.pageId=page.id;parent.add(root);
 cube(root,deskMat,0,.91,-.36,1.70,.10,.86);
 for(const x of [-.70,.70])for(const z of [-.66,-.05])cube(root,legMat,x,.42,z,.09,.8,.09);
 cube(root,monitorMat,0,1.29,-.60,.72,.49,.08);
 cube(root,screenMat,0,1.29,-.54,.61,.36,.018);
 cube(root,legMat,0,1.00,-.58,.08,.15,.08);
 cube(root,monitorMat,0,.98,-.03,.70,.03,.24);
 // Cadeira continua no lugar mesmo quando a página for ocultada.
 cube(root,legMat,0,.42,.65,.64,.10,.55);
 cube(root,legMat,0,.75,.92,.68,.72,.12);
 for(const x of [-.27,.27])cube(root,legMat,x,.23,.66,.06,.34,.06);
 const worker=new T.Group();worker.userData.pageId=page.id;root.add(worker);
 worker.position.set(0,0,.72);
 const skin=skinMats[index%skinMats.length],hair=hairMats[index%hairMats.length];
 oval(worker,coat,0,.82,0,.28,.39,.25);
 oval(worker,legMat,0,.53,0,.28,.15,.24);
 for(const x of [-1,1]){
   oval(worker,legMat,x*.16,.28,.09,.105,.25,.11);
   oval(worker,legMat,x*.17,.09,.18,.15,.055,.20);
   const arm=oval(worker,coat,x*.33,.83,.13,.12,.29,.125);arm.rotation.x=-.55;arm.rotation.z=x*.18;
   oval(worker,skin,x*.35,.64,.29,.105,.11,.095);
 }
 const head=new T.Group();head.position.set(0,1.21,.02);worker.add(head);
 oval(head,skin,0,.10,.04,.36,.38,.34);
 oval(head,hair,0,.37,-.01,.38,.21,.33);
 for(const x of [-1,1]){
   oval(head,screenMat,x*.13,.10,.357,.068,.083,.022);
   oval(head,monitorMat,x*.13,.097,.379,.038,.051,.01);
 }
 const update=t=>{worker.position.y=Math.sin(t*1.25+index*.74)*.015;head.rotation.y=Math.sin(t*.48+index)*.065;};
 return {root,worker,update};
}
export function createIntranet(departments){
 const root=new T.Group();root.position.set(0,8.3,-1);root.userData.floorNumber=2;
 const base=new T.Group();root.add(base);
 cube(base,floorMat,0,-.25,0,37.3,.48,24.7);
 cube(base,beamMat,0,-.46,0,37.5,.21,24.9);
 // Paredes externas semi-transparentes mesmo com o 2º andar ativo.
 const edge=new T.MeshStandardMaterial({color:0xb5d5d0,roughness:.89,transparent:true,opacity:.66,depthWrite:false});
 const perimeter=[
   [0,1.3,-12.30,37.1,2.6,.16],
   [-18.5,1.3,0,.16,2.6,24.5],
   [18.5,1.3,0,.16,2.6,24.5],
   [0,1.3,12.30,37.1,2.6,.16]
 ];
 for(const item of perimeter){const obj=cube(base,edge,...item);obj.raycast=()=>{};}
 // Corredor central entre as divisórias.
 cube(base,m(0x7b9697),0,.022,0,37.0,.045,1.15);
 const sectors=new Map(), pages=new Map(), animations=[];
 let overall=0;
 for(const [idx,dep] of departments.slice(0,8).entries()){
   const col=idx%4,row=Math.floor(idx/4),ox=-13.7+col*9.12,oz=-6.0+row*12.0;
   const sector=new T.Group();sector.position.set(ox,.02,oz);sector.userData.departmentId=dep.id;
   base.add(sector);sectors.set(dep.id,sector);
   const accent=new T.Color(dep.accent||"#a4d8bd");
   const tinted=coatMats[idx%coatMats.length];
   cube(sector,m(accent.clone().lerp(new T.Color("#526f75"),.55)),0,.028,0,8.78,.04,10.83);
   // Divisórias leves, meia altura, para não obstruir o interior.
   const sideMat=new T.MeshStandardMaterial({color:0x9bbcb7,roughness:.78,transparent:true,opacity:.48,depthWrite:false});
   cube(sector,sideMat,-4.35,.78,0,.11,1.55,10.72);
   cube(sector,sideMat,4.35,.78,0,.11,1.55,10.72);
   cube(sector,sideMat,0,.78,-5.36,8.78,1.55,.11);
   const sign=label(dep.name,(dep.pages?.length||0)+" PÁGINAS",dep.accent);
   sign.scale.set(3.95,.86,1);sign.position.set(0,3.75,-4.4);sector.add(sign);
   const all=dep.pages||[];
   for(let i=0;i<Math.min(16,all.length);i++){
     const page=all[i],x=-3.15+(i%4)*2.11,z=-3.50+Math.floor(i/4)*2.25;
     const obj=desk(sector,page,tinted,idx*17+i);obj.root.position.set(x,0,z);
     pages.set(page.id,{...obj,departmentId:dep.id,position:obj.root,index:i});
     animations.push(obj);
     overall++;
   }
 }
 const sign=label("INTRANET","ANDAR 02  •  PÁGINAS E DEPARTAMENTOS","#b0e8c5");
 sign.scale.set(8.9,1.97,1);sign.position.set(0,5.1,-11.0);base.add(sign);
 // Ghosting preserva a silhueta e o interior (não fica 100% invisível).
 const materials=new Set(sharedMaterials);
 root.traverse(o=>{const list=Array.isArray(o.material)?o.material:o.material?[o.material]:[];for(const material of list)materials.add(material);});
 const originals=new Map([...materials].map(mat=>[mat,{opacity:mat.opacity,transparent:mat.transparent,depthWrite:mat.depthWrite}]));
 let ghost=null;const hidden=new Set();
 function updateVisible(){
   for(const [id,obj]of pages){
     obj.worker.visible=!hidden.has("page:"+id) && (!ghost || obj.index%6===0);
   }
   for(const [id,obj]of sectors)obj.visible=!hidden.has("department:"+id);
 }
 function setGhost(value){
   if(ghost===Boolean(value))return;
   ghost=Boolean(value);
   for(const [material,origin]of originals){
     material.transparent=ghost?true:origin.transparent;
     material.opacity=ghost?Math.min(origin.opacity,.19):origin.opacity;
     material.depthWrite=ghost?false:origin.depthWrite;
     material.needsUpdate=true;
   }
   updateVisible();
 }
 function setHidden(set){hidden.clear();for(const key of set)hidden.add(key);updateVisible();}
 function update(t){if(ghost)return;for(const obj of animations)if(obj.worker.visible)obj.update(t);}
 return {root,pages,sectors,setGhost,setHidden,update,pageCount:overall};
}
