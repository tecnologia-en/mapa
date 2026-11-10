/* Estante dinâmica e leve: três prateleiras visíveis, quantas lojas existirem.
 * Livros = computadores reais. Offline inclina, sem animação pesada.
 */
import * as T from "./three.module.js";
import {planShelves,bookLean,rowWindow,VISIBLE_ROWS} from "./shelf_rules.mjs";

const fixedMaterials={
  wood:new T.MeshStandardMaterial({color:0x68564d,roughness:.84}),
  shelf:new T.MeshStandardMaterial({color:0xa79b85,roughness:.75}),
  steel:new T.MeshStandardMaterial({color:0x6b9290,roughness:.59}),
  label:new T.MeshStandardMaterial({color:0x2a4f4c,roughness:.73}),
  white:new T.MeshStandardMaterial({color:0xe5d9ba,roughness:.88})
};
const cachedMaterials=new Map();
const coverColors=[0x8da7b6,0xb1a0c5,0xc5aa89,0x80ae9d,0xcdada3,0x8c9fba,0xb7ba92];
function colorMaterial(hex){
  if(!cachedMaterials.has(hex))cachedMaterials.set(hex,new T.MeshStandardMaterial({color:hex,roughness:.78}));
  return cachedMaterials.get(hex);
}
const shared=new Set([...Object.values(fixedMaterials)]);
function cuboid(parent,w,h,d,material,x=0,y=0,z=0){
  const obj=new T.Mesh(new T.BoxGeometry(w,h,d),material);
  obj.position.set(x,y,z);parent.add(obj);return obj;
}
function makeLabel(first,second="",scale=1){
  const canvas=document.createElement("canvas");canvas.width=672;canvas.height=150;
  const c=canvas.getContext("2d");
  c.fillStyle="rgba(16,36,43,.97)";c.beginPath();c.roundRect(4,6,664,140,18);c.fill();
  c.strokeStyle="rgba(169,221,188,.65)";c.lineWidth=2;c.stroke();
  c.fillStyle="#e6f5eb";c.textAlign="center";c.font="bold 47px Segoe UI,Arial";
  c.fillText(String(first).slice(0,36),336,78,626);
  if(second){c.fillStyle="#abc9c4";c.font="600 26px Segoe UI,Arial";
    c.fillText(String(second).slice(0,48),336,122,628);}
  const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
  const sprite=new T.Sprite(new T.SpriteMaterial({map:tex,depthWrite:false,depthTest:false,transparent:true}));
  sprite.scale.set(3.1*scale,.70*scale,1);
  sprite.raycast=()=>{};
  return sprite;
}
function freeChildren(group){
  group.traverse(node=>{
    node.geometry?.dispose();
    if(!node.material)return;
    const materials=Array.isArray(node.material)?node.material:[node.material];
    for(const m of materials){
      if(shared.has(m)||[...cachedMaterials.values()].includes(m))continue;
      m.map?.dispose();m.dispose();
    }
  });
  group.clear();
}
const BOOK_HEIGHT=.68;
const SHELF_WIDTH=7.55;
const ROW_GAP=1.32;
function rowBottom(i){return .62+(VISIBLE_ROWS-1-i)*ROW_GAP;}
export function createBookshelf(){
  const root=new T.Group();root.name="Estante de Computadores";root.userData.shelfTarget=true;
  root.position.set(3.45,0,-3.75);
  root.scale.setScalar(.57); // compacto no escritório; tamanho real na visão frontal
  const structure=new T.Group();root.add(structure);
  const W=SHELF_WIDTH,D=.77,H=4.65;
  cuboid(structure,W+.20,.22,D+.12,fixedMaterials.wood,0,.20,0);
  for(const x of [-W/2+.10,W/2-.10]){
    cuboid(structure,.22,H,D,fixedMaterials.wood,x,H/2+.23,0);
    cuboid(structure,.055,H,D+.07,fixedMaterials.steel,x,H/2+.23,.08);
  }
  cuboid(structure,W,.18,D+.06,fixedMaterials.wood,0,H+.25,0);
  cuboid(structure,W-.36,H-.08,.14,fixedMaterials.wood,0,H/2+.24,-D/2+.09);
  for(let i=0;i<VISIBLE_ROWS;i++){
    const y=rowBottom(i);
    cuboid(structure,W-.30,.12,D+.07,fixedMaterials.shelf,0,y-.045,0);
    cuboid(structure,W-.30,.03,.07,fixedMaterials.steel,0,y+.010,D/2+.02);
  }
  const title=makeLabel("COMPUTADORES","UM LIVRO · UM COMPUTADOR",1.2);
  title.position.set(0,5.56,0);root.add(title);
  const rowsRoot=new T.Group();root.add(rowsRoot);
  let progress=null,rows=[],offset=0,lastSignature="",lastHovered=null;
  const objects=new Map();
  const stores=new Map();
  const scrollListeners=new Set();
  function updateProgress(){
    if(progress){root.remove(progress);progress.material.map?.dispose();progress.material.dispose();}
    const info=rowWindow(rows,offset);
    progress=makeLabel(
      info.total ? ("LOJAS "+info.first+"–"+info.last+" / "+info.total) : "SEM LOJAS",
      info.canNext?"ROLE PARA VER MAIS":"ÚLTIMA PRATELEIRA",.68
    );
    progress.position.set(0,4.88,.34);root.add(progress);
    for(const callback of scrollListeners)callback(info);
  }
  function repaint(){
    freeChildren(rowsRoot);objects.clear();stores.clear();lastHovered=null;
    const visible=rowWindow(rows,offset);offset=visible.offset;
    for(const [i,row]of visible.rows.entries()){
      const y=rowBottom(i),group=new T.Group();group.userData.storeId=row.name;rowsRoot.add(group);
      stores.set(row.name,group);
      // Área sempre identificável, inclusive as seis lojas fixas vazias.
      const label=makeLabel(row.name,
        row.books.length?row.books.length+" COMPUTADOR"+(row.books.length===1?"":"ES"):"SEM COMPUTADORES",.65);
      label.position.set(-2.61,y+.74,.49);group.add(label);
      const clickArea=cuboid(group,1.86,.36,.045,fixedMaterials.label,-2.58,y+.69,.41);
      clickArea.userData.storeId=row.name;
      const n=row.books.length;
      const left=-1.30,right=3.30;
      const step=n>1?Math.min(.43,(right-left)/(n-1)):.43;
      const start=n>1?left+(right-left-step*(n-1))*.15:.0;
      for(let j=0;j<n;j++){
        const data=row.books[j],book=new T.Group();book.userData.computerId=data.id;
        book.position.set(start+j*step,y+.035,.21);
        group.add(book);
        const width=Math.min(.22,Math.max(.12,step*.60));
        const height=BOOK_HEIGHT+(j%3)*.065;
        book.rotation.z=bookLean(data.status,j,n);
        cuboid(book,width,height,.28,colorMaterial(coverColors[(j+i*2)%coverColors.length]),0,height/2,0);
        cuboid(book,.035,height-.08,.014,fixedMaterials.white,-width*.25,height/2,.147);
        const stateColor=data.status==="online"?0x8ad4a9:data.status==="offline"?0xe5a08d:0xb1b9bc;
        cuboid(book,width+.012,.062,.29,colorMaterial(stateColor),0,.068,0);
        const label=makeLabel(data.name,
          data.status==="online"?"CONECTADO":data.status==="offline"?"DESCONECTADO":"SEM SINAL",.72);
        label.position.set(book.position.x,y+.96,.77);
        label.visible=false;group.add(label); // horizontal, não gira junto do livro
        objects.set(data.id,{book,label,computer:data,store:row.name});
      }
    }
    updateProgress();
  }
  function sync(devices,hidden){
    const nextRows=planShelves(devices,hidden);
    const nextSignature=JSON.stringify(nextRows.map(r=>[r.name,r.books.map(b=>[b.id,b.name,b.status])]));
    if(nextSignature===lastSignature)return;
    rows=nextRows;lastSignature=nextSignature;
    offset=rowWindow(rows,offset).offset;
    repaint(); // realoca imediatamente ao ocultar a última máquina de uma loja opcional
  }
  function scroll(amount){
    const next=rowWindow(rows,offset+Math.sign(amount)).offset;
    if(next===offset)return false;
    offset=next;repaint();return true;
  }
  function hover(id){
    if(lastHovered===id)return;
    if(lastHovered&&objects.has(lastHovered))objects.get(lastHovered).label.visible=false;
    lastHovered=id;
    if(id&&objects.has(id))objects.get(id).label.visible=true;
  }
  function onScroll(cb){scrollListeners.add(cb);return()=>scrollListeners.delete(cb);}
  function pageInfo(){return rowWindow(rows,offset);}
  function dispose(){
    freeChildren(rowsRoot);
    if(progress){root.remove(progress);progress.material.map?.dispose();progress.material.dispose();progress=null;}
    // Título é um sprite próprio (os materiais globais são compartilhados).
    root.remove(title);title.material.map?.dispose();title.material.dispose();
  }
  return {root,sync,scroll,hover,onScroll,pageInfo,dispose,
    get rowOffset(){return offset;},get maxOffset(){return Math.max(0,rows.length-VISIBLE_ROWS);},
    get stores(){return stores;},get books(){return objects;}};
}
