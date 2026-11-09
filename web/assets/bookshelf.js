/* Uma estante compacta: cada prateleira é uma loja; cada livro é um computador.
   No modo frontal, roda do mouse percorre as lojas sem girar a câmera.
   Rótulos individuais ficam invisíveis até o cursor passar sobre o livro.
*/
import * as T from "./three.module.js";

const baseMaterial=new T.MeshStandardMaterial({color:0x716257,roughness:.79});
const trimMaterial=new T.MeshStandardMaterial({color:0x9a8e78,roughness:.71});
const metalMaterial=new T.MeshStandardMaterial({color:0x7ea9a1,roughness:.51});
const materialCache=new Map();
const bcolor=[0x8da7b6,0xa8a0be,0xbd9e84,0x88aa98,0xc7afb2,0x98b2a5];
function paint(hex){if(!materialCache.has(hex))materialCache.set(hex,new T.MeshStandardMaterial({color:hex,roughness:.81}));return materialCache.get(hex);}
function box(group,w,h,d,mat,x=0,y=0,z=0){
 const obj=new T.Mesh(new T.BoxGeometry(w,h,d),mat);obj.position.set(x,y,z);group.add(obj);return obj;
}
function makeLabel(first,second="",scale=1.0){
 const c=document.createElement("canvas");c.width=560;c.height=130;const g=c.getContext("2d");
 g.fillStyle="rgba(20,40,47,.94)";g.beginPath();g.roundRect(4,6,552,118,16);g.fill();
 g.strokeStyle="rgba(177,229,197,.69)";g.lineWidth=2;g.stroke();
 g.textAlign="center";g.fillStyle="#effbf1";g.font="bold 41px Segoe UI,Arial";
 g.fillText(String(first).slice(0,37),280,64,515);
 if(second){g.fillStyle="#bfd5cc";g.font="600 22px Segoe UI,Arial";g.fillText(String(second).slice(0,55),280,102,520);}
 const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;
 const sprite=new T.Sprite(new T.SpriteMaterial({map:tx,transparent:true,depthWrite:false,depthTest:false}));
 sprite.scale.set(2.65*scale,.62*scale,1);
 sprite.raycast=()=>{};
 return sprite;
}
function disposeDynamic(root){
 root.traverse(o=>{
   o.geometry?.dispose();
   if(o.material){
     const arr=Array.isArray(o.material)?o.material:[o.material];
     for(const m of arr){
       if(m===baseMaterial||m===trimMaterial||m===metalMaterial||[...materialCache.values()].includes(m))continue;
       m.map?.dispose();m.dispose();
     }
   }
 });
}
export function createBookshelf(){
 const root=new T.Group();root.name="Estante de Computadores";root.userData.shelfTarget=true;
 // Parede de trás da sala Enfoque OS, sem invadir as mesas.
 root.position.set(3.65,0,-3.4);
 const main=new T.Group();root.add(main);
 const W=4.75,H=3.67,D=.65;
 box(main,W,.14,D,baseMaterial,0,.12,0);
 for(const x of [-W/2+.11,W/2-.11])box(main,.21,H,D,baseMaterial,x,H/2+.17,0);
 box(main,W,.16,D,trimMaterial,0,H+.23,0);
 box(main,W-.32,H-.08,.08,baseMaterial,0,H/2+.2,-.25);
 for(let i=0;i<6;i++){
   const yy=.43+i*.59;
   box(main,W-.31,.085,D,trimMaterial,0,yy,0);
   box(main,W-.31,.020,.055,metalMaterial,0,yy+.044,D/2);
 }
 const header=makeLabel("COMPUTADORES","UM LIVRO = UM EQUIPAMENTO",1.22);
 header.position.set(0,4.33,0);root.add(header);
 const dynamic=new T.Group();root.add(dynamic);
 const bookObjects=new Map();
 const stores=new Map();
 let ordered=[],hiddenSet=new Set(),offset=0,layoutKey="",maxOffset=0;
 function render(){
   disposeDynamic(dynamic);dynamic.clear();bookObjects.clear();stores.clear();
   const grouped=new Map();
   for(const pc of ordered){const key=String(pc.owner||"Sem loja");if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(pc);}
   const rows=[...grouped.entries()];maxOffset=Math.max(0,rows.length-5);
   offset=Math.min(offset,maxOffset);
   for(let i=0;i<Math.min(5,rows.length-offset);i++){
     const [store,items]=rows[i+offset],y=.49+i*.59;
     const storeGroup=new T.Group();storeGroup.userData.storeId=store;dynamic.add(storeGroup);stores.set(store,storeGroup);
     const tag=makeLabel(store,(items.length)+" COMPUTADORES",.48);
     tag.position.set(-1.62,y+.34,.43);storeGroup.add(tag);
     // Small visible store-name plaque remains clickable even if whole store is hidden.
     const plaque=box(storeGroup,1.19,.20,.035,metalMaterial,-1.58,y+.275,.345);
     plaque.userData.storeId=store;
     const showStore=!hiddenSet.has("store:"+store);
     for(let j=0;j<Math.min(10,items.length);j++){
       const pc=items[j],book=new T.Group();book.userData.computerId=pc.id;
       book.position.set(-.75+j*.315,y,.16);storeGroup.add(book);
       book.visible=showStore&&!hiddenSet.has("computer:"+pc.id);
       const width=.145,height=.29+(j%3)*.045;
       box(book,width,height,.255,paint(bcolor[(i+j)%bcolor.length]),0,height/2+.015,0);
       box(book,.035,height-.03,.012,trimMaterial,-.045,height/2+.017,.14);
       const stripe=pc.status==="online"?0x88ddab:pc.status==="offline"?0xa5b1be:0xd5be9b;
       box(book,width+.01,.038,.26,paint(stripe),0,.040,0);
       const caption=makeLabel(pc.name,pc.status==="online"?"ONLINE":pc.status==="offline"?"DESCONECTADO":"SEM SINAL",.62);
       caption.position.set(0,-.31,.38);caption.visible=false;
       book.add(caption);bookObjects.set(pc.id,{group:book,caption,pc});
     }
   }
 }
 function sync(input,hidden){
   const list=Array.isArray(input)?input:[];
   hiddenSet=new Set(hidden||[]);
   const key=JSON.stringify(list.map(d=>[d.id,d.owner,d.status]).concat([...hiddenSet].sort()));
   ordered=list.slice().sort((a,b)=>String(a.owner).localeCompare(String(b.owner),"pt")||String(a.name).localeCompare(String(b.name),"pt"));
   if(key!==layoutKey){layoutKey=key;render();}
 }
 function scroll(amount){
   const next=Math.max(0,Math.min(maxOffset,offset+Math.sign(amount)));
   if(next!==offset){offset=next;render();return true;}return false;
 }
 function hover(id){
   for(const [key,entry]of bookObjects)entry.caption.visible=key===id&&entry.group.visible;
 }
 function select(id){return bookObjects.get(id)||null;}
 return {root,sync,scroll,hover,select,get rowOffset(){return offset},get maxOffset(){return maxOffset},dispose(){disposeDynamic(dynamic);dynamic.clear();}};
}
