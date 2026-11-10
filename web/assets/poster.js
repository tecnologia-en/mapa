/* Cartaz de parede leve: a lista de computadores é HTML, não modelos 3D.
   O cartaz só tem geometrias planas geradas no código. */
import * as T from "./three.module.js";

const paper = new T.MeshStandardMaterial({color:0xf1f2eb,roughness:.88});
const border = new T.MeshStandardMaterial({color:0x53756c,roughness:.74});
const pinMaterial = new T.MeshStandardMaterial({color:0xb5a575,metalness:.32,roughness:.54});

export function createComputerPoster(){
  const root=new T.Group();
  root.name="Aviso de computadores";
  root.userData.shelfTarget=true; // mantém a identificação nos cliques do mapa
  root.position.set(4.64,2.24,-5.17);

  const frame=new T.Mesh(new T.BoxGeometry(2.02,2.44,.085),border);
  root.add(frame);
  const backing=new T.Mesh(new T.BoxGeometry(1.93,2.35,.045),paper);
  backing.position.z=.068;root.add(backing);

  const canvas=document.createElement("canvas");
  canvas.width=600;canvas.height=720;
  const c=canvas.getContext("2d");
  c.fillStyle="#eff0e9";c.fillRect(0,0,600,720);
  c.fillStyle="#295149";c.fillRect(0,0,600,142);
  c.fillStyle="#f5f7f3";c.font="bold 67px Segoe UI, Arial";c.textAlign="center";
  c.fillText("COMPUTADORES",300,94,545);

  c.fillStyle="#54776e";c.fillRect(80,196,440,3);
  c.textAlign="left";
  for(let i=0;i<4;i++){
    const y=274+i*88;
    c.fillStyle="#96a9a4";c.beginPath();c.arc(100,y,9,0,Math.PI*2);c.fill();
    c.fillStyle="#c9d5d0";c.fillRect(133,y-8,365-i*27,15);
    c.fillStyle="#e1e8e3";c.fillRect(133,y+16,252+i*23,9);
  }
  c.fillStyle="#315b50";c.beginPath();c.roundRect(74,588,452,79,14);c.fill();
  c.fillStyle="#f3f8f4";c.textAlign="center";c.font="bold 41px Segoe UI, Arial";
  c.fillText("CLIQUE PARA VER",300,641,425);
  const texture=new T.CanvasTexture(canvas);
  texture.colorSpace=T.SRGBColorSpace;
  const front=new T.Mesh(new T.PlaneGeometry(1.84,2.27),
    new T.MeshStandardMaterial({map:texture,roughness:.95}));
  front.position.z=.094;root.add(front);
  const pinGeo=new T.SphereGeometry(.039,10,6);
  for(const x of [-.83,.83])for(const y of [-1.02,1.04]){
    const pin=new T.Mesh(pinGeo,pinMaterial);
    pin.position.set(x,y,.135);root.add(pin);
  }

  function dispose(){
    for(const obj of [frame,backing,front]){
      obj.geometry.dispose();
    }
    front.material.map?.dispose();front.material.dispose();
    pinGeo.dispose();
  }
  return {root,dispose};
}
