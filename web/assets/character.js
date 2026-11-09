/* Character Studio: personagens suaves e carismáticos 100% procedurais.
   Nunca usa BoxGeometry no corpo. Hierarquia ombro/cotovelo/quadril/joelho/pescoço. */
export function createCharacter(T, definition, options = {}) {
  const p=definition;
  const chief=p.kind==="chief";
  const root=new T.Group();root.userData.personId=p.id;
  const body=new T.Group();root.add(body);
  const scale=chief?1.17:0.99;body.scale.setScalar(scale);
  const skin=new T.Color(p.skin||"#d6a27c"),fabric=new T.Color(p.shirt||"#719f9a");
  const dark=fabric.clone().multiplyScalar(.68),trim=new T.Color(chief?"#f7d9a0":"#d8e4eb");
  const mat=(c,roughness=.87,metalness=0)=>new T.MeshStandardMaterial({color:c,roughness,metalness});
  const skinMat=mat(skin,.87),clothMat=mat(fabric,.92),darkMat=mat(dark,.83),trimMat=mat(trim,.75);
  const geo={
    sphere:new T.SphereGeometry(1,20,15),
    capsule:(r,h)=>new T.CapsuleGeometry(r,h,5,12),
    cylinder:(r1,r2,h)=>new T.CylinderGeometry(r1,r2,h,18)
  };
  function mesh(geom,material,parent,x=0,y=0,z=0,sx=1,sy=1,sz=1){
    const m=new T.Mesh(geom,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);
    m.userData.personId=p.id;parent.add(m);return m;
  }
  function ellipsoid(parent,x,y,z,sx,sy,sz,material){return mesh(geo.sphere,material,parent,x,y,z,sx,sy,sz);}
  function cap(parent,r,height,material,x,y,z){
    return mesh(geo.capsule(r,height),material,parent,x,y,z);
  }
  function tube(parent,pts,r,color){
    const c=new T.CatmullRomCurve3(pts.map(v=>new T.Vector3(...v)));
    return mesh(new T.TubeGeometry(c,16,r,6,false),mat(color),parent);
  }
  // Base and tiny contact shadow.
  const shadowMat=new T.MeshBasicMaterial({color:0x12232d,transparent:true,opacity:.22,depthWrite:false});
  const shadow=mesh(new T.CircleGeometry(chief?.70:.61,22),shadowMat,root,0,.014,0);
  shadow.rotation.x=-Math.PI/2;
  if(chief){
    const ring=mesh(new T.RingGeometry(.67,.73,38),new T.MeshBasicMaterial({color:0xecc78a,transparent:true,opacity:.66,side:T.DoubleSide}),root,0,.027,0);
    ring.rotation.x=-Math.PI/2;
  }
  // Feet: organically bevelled shoe profile, ExtrudeGeometry rather than boxes.
  function shoe(parent,x,side){
    const shape=new T.Shape();
    shape.moveTo(-.20,-.15);shape.quadraticCurveTo(-.29,-.15,-.28,-.02);
    shape.quadraticCurveTo(-.20,.23,.03,.29);
    shape.quadraticCurveTo(.25,.31,.30,.08);
    shape.quadraticCurveTo(.34,-.15,.18,-.18);
    shape.closePath();
    const shoeGeo=new T.ExtrudeGeometry(shape,{depth:.23,steps:1,bevelEnabled:true,bevelThickness:.07,bevelSize:.05,bevelSegments:3,curveSegments:8});
    shoeGeo.rotateX(-Math.PI/2);
    const m=mesh(shoeGeo,mat(chief?"#262f39":"#44596a",.68),parent,x,.09,.19,1,1,1);
    mesh(geo.sphere,mat(0xf3f1e7),parent,x,.165,.31,.20,.027,.12);
    return m;
  }
  const hips=new T.Group();hips.position.set(0,1.14,0);body.add(hips);
  ellipsoid(hips,0,0,0,.46,.25,.30,darkMat);
  const legs=[];
  for(const side of [-1,1]){
    const hip=new T.Group();hip.position.set(side*.25,-.07,0);hips.add(hip);
    cap(hip,.17,.37,mat(chief?"#303a51":"#46677b"),0,-.27,0);
    const knee=new T.Group();knee.position.set(0,-.65,0);hip.add(knee);
    ellipsoid(knee,0,0,0,.165,.19,.165,mat(chief?"#303a51":"#46677b"));
    cap(knee,.145,.36,mat(chief?"#303a51":"#46677b"),0,-.27,0);
    shoe(knee,0,side);
    legs.push({hip,knee});
  }
  // Curved torso via LatheGeometry (distinct jacket and shirt profiles).
  const torsoPoints=[
    [0.26,0],[.43,.09],[.48,.26],[.50,.45],[.49,.64],[.46,.78],[.42,.95],[.30,1.07],[.23,1.14]
  ].map(([r,y])=>new T.Vector2(r,y));
  const torso=new T.Group();torso.position.y=1.15;body.add(torso);
  mesh(new T.LatheGeometry(torsoPoints,28),clothMat,torso,0,0,0);
  ellipsoid(torso,0,.76,.02,.48,.32,.34,clothMat);
  const neck=new T.Group();neck.position.set(0,1.12,0);torso.add(neck);
  cap(neck,.17,.12,skinMat,0,.10,0);
  // Jacket lapels with curved geometry and tie or hoodie cord.
  if(chief){
    for(const side of [-1,1]){
      const shape=new T.Shape();
      shape.moveTo(0,0);shape.lineTo(.18,-.07);shape.quadraticCurveTo(.25,-.43,.08,-.69);
      shape.lineTo(-.03,-.26);shape.closePath();
      const geom=new T.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelThickness:.015,bevelSize:.012,bevelSegments:3});
      const lapel=mesh(geom,darkMat,torso,side*.08,.96,.345,side,1,1);lapel.rotation.z=side*.09;
    }
    const tie=mat("#d6b783",.71);
    mesh(new T.ConeGeometry(.105,.31,10),tie,torso,0,.65,.405);
    ellipsoid(torso,0,.84,.41,.075,.075,.035,tie);
    ellipsoid(torso,.32,.63,.41,.06,.06,.02,trimMat);
  }else if(p.outfit==="hoodie"){
    const hood=new T.TorusGeometry(.31,.13,8,20,Math.PI*1.22);
    const hm=mesh(hood,darkMat,torso,0,.98,-.10);hm.rotation.x=.22;
    tube(torso,[[-.12,.92,.38],[-.13,.72,.40]],.017,0xe8e2c9);
    tube(torso,[[.12,.92,.38],[.13,.65,.40]],.017,0xe8e2c9);
    ellipsoid(torso,0,.20,.47,.20,.12,.026,darkMat);
  }else{
    tube(torso,[[-.16,.91,.38],[0,.79,.40],[.16,.91,.38]],.023,0xf3e2c9);
    ellipsoid(torso,0,.55,.46,.045,.04,.02,trimMat);
  }
  // Arms: two joints per side; each limb capsule smooth. Hands with tiny fingers.
  const shoulders=[];
  for(const side of [-1,1]){
    const shoulder=new T.Group();shoulder.position.set(side*.47,.89,0);torso.add(shoulder);
    ellipsoid(shoulder,0,0,0,.23,.27,.23,clothMat);
    cap(shoulder,.15,.38,clothMat,side*.02,-.29,.01);
    const elbow=new T.Group();elbow.position.set(side*.04,-.58,.06);shoulder.add(elbow);
    ellipsoid(elbow,0,0,0,.15,.17,.15,clothMat);
    cap(elbow,.127,.31,skinMat,0,-.24,.08);
    const hand=new T.Group();hand.position.set(0,-.46,.14);elbow.add(hand);
    ellipsoid(hand,0,0,0,.145,.17,.12,skinMat);
    for(let f=0;f<3;f++)ellipsoid(hand,(f-1)*.075,-.15,.06,.037,.085,.04,skinMat);
    shoulders.push({shoulder,elbow,hand,side});
  }
  // Head: large slightly elliptical chibi face, cheeks, ears and independent eyelids.
  const headRig=new T.Group();headRig.position.set(0,.32,0);neck.add(headRig);
  const head=ellipsoid(headRig,0,.28,.02,.47,.49,.42,skinMat);
  for(const side of [-1,1]){
    ellipsoid(headRig,side*.455,.23,.05,.085,.14,.11,skinMat);
    ellipsoid(headRig,side*.353,.10,.322,.135,.085,.055,mat(skin.clone().lerp(new T.Color("#f09e9d"),.21)));
  }
  const eyes=[];
  const eyeWhite=mat(0xfffbf3,.44),irisMat=mat(chief?0x715c45:0x42738a,.41),pupilMat=mat(0x1e2d37,.32),glintMat=new T.MeshBasicMaterial({color:0xffffff});
  for(const side of [-1,1]){
    const eye=new T.Group();eye.position.set(side*.18,.29,.407);headRig.add(eye);
    ellipsoid(eye,0,0,0,.137,.155,.053,eyeWhite);
    ellipsoid(eye,0,-.009,.051,.077,.091,.026,irisMat);
    ellipsoid(eye,0,-.011,.075,.043,.056,.02,pupilMat);
    ellipsoid(eye,-.024,.031,.095,.021,.024,.01,glintMat);
    const eyebrow=tube(headRig,[[side*.11,.53,.365],[side*.18,.56,.378],[side*.27,.51,.34]],.024,chief?0x352f31:0x493638);
    eyes.push({eye,eyebrow,side});
  }
  ellipsoid(headRig,0,.14,.442,.06,.082,.05,mat(skin.clone().multiplyScalar(.92)));
  const mouths={};
  const mouthColor=new T.Color("#754a4a");
  const smile=[[-.10,.015,.410],[0,-.027,.453],[.10,.015,.410]];
  const neutral=[[-.065,0,.432],[0,-.010,.449],[.065,0,.432]];
  const frown=[[-.10,-.017,.411],[0,.022,.447],[.10,-.017,.411]];
  for(const [key,points] of Object.entries({smile,neutral,frown})){
    const m=tube(headRig,points,.018,mouthColor);m.visible=key==="neutral";mouths[key]=m;
  }
  // Hair: organic caps, curls, side-swept tufts, or bun.
  const hairMat=mat(["#272b36","#4b342c","#282b2d","#593d34","#27232a","#3c323c"][options.index%6]||"#282b34",.95);
  const hairTop=ellipsoid(headRig,0,.646,-.06,.485,.265,.435,hairMat);hairTop.rotation.z=.045;
  for(let j=0;j<5;j++){
    const phi=(j-2)*.38;
    const tuft=ellipsoid(headRig,Math.sin(phi)*.31,.64+Math.cos(phi)*.05,.22-Math.abs(phi)*.12,.125,.18,.21,hairMat);
    tuft.rotation.z=phi*.3;
  }
  switch(p.hair){
    case "quiff":
      for(let i=0;i<4;i++){const curl=ellipsoid(headRig,-.20+i*.16,.82+(3-i)*.06,.17,.17,.21,.19,hairMat);curl.rotation.z=.28;}break;
    case "curly":
      for(let i=0;i<8;i++){const a=i*Math.PI/4;ellipsoid(headRig,Math.cos(a)*.37,.79+Math.sin(i*2.2)*.04,Math.sin(a)*.24,.19,.18,.19,hairMat);}break;
    case "bun":
      ellipsoid(headRig,0,.76,-.42,.27,.26,.29,hairMat);break;
    case "waves":
      for(let i=0;i<4;i++){ellipsoid(headRig,-.4+i*.26,.72+.04*Math.sin(i),-.24,.21,.25,.22,hairMat);}break;
    case "side":
      for(let i=0;i<3;i++){const t=ellipsoid(headRig,.09+i*.14,.79-i*.08,.22,.18,.16,.20,hairMat);t.rotation.z=-.5;}break;
    default: break;
  }
  // Accessories, all procedural.
  if(p.id==="os-agent"||p.id==="infra-mcp"){
    const arc=new T.TorusGeometry(.53,.055,9,25,Math.PI*1.3);
    const t=mesh(arc,mat(0x30485a,.48),headRig,0,.32,-.03);
    t.rotation.z=-.45;t.rotation.y=Math.PI;
    for(const side of [-1,1])ellipsoid(headRig,side*.50,.30,.07,.095,.20,.12,mat(0x365569,.55));
  }
  if(p.id==="infra-vpn"||p.id==="os-login"){
    const glass=mat(0x546271,.4,.25);
    for(const side of [-1,1]){
      const ring=mesh(new T.TorusGeometry(.155,.025,7,24),glass,headRig,side*.19,.28,.465);
      ring.scale.y=.8;
    }
    tube(headRig,[[-.04,.29,.468],[.04,.29,.468]],.023,0x546271);
  }
  if(chief){
    // Badge on jacket.
    ellipsoid(torso,-.28,.40,.42,.16,.12,.028,trimMat);
    ellipsoid(torso,-.28,.4,.448,.10,.052,.012,mat(0x556e72));
  }
  const statusOrbit=ellipsoid(root,0,3.75*scale,0,.18,.18,.18,mat(0x8e9dac,.42));
  statusOrbit.material.emissive=new T.Color(0x7393a0);statusOrbit.material.emissiveIntensity=.24;
  // Text sprites always face camera automatically (Three.Sprite).
  const canvas=document.createElement("canvas");canvas.width=720;canvas.height=170;
  const ctx=canvas.getContext("2d");
  const texture=new T.CanvasTexture(canvas);
  const tag=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false,depthTest:false}));
  tag.scale.set(4.65,1.10,1);tag.position.set(0,4.22*scale,0);root.add(tag);
  let current="unknown";
  const statusColors={active:"#84e8b0",inactive:"#f7b48f",failed:"#f28d91",unknown:"#a3b5c7"};
  function label(status){
    const c=statusColors[status]||statusColors.unknown;
    ctx.clearRect(0,0,720,170);
    ctx.fillStyle="rgba(17,31,44,.93)";ctx.beginPath();ctx.roundRect(10,9,700,149,23);ctx.fill();
    ctx.strokeStyle="rgba(213,236,241,.34)";ctx.lineWidth=3;ctx.stroke();
    ctx.beginPath();ctx.fillStyle=c;ctx.arc(45,53,13,0,Math.PI*2);ctx.fill();
    ctx.textAlign="left";ctx.fillStyle="#ecf9f4";ctx.font="700 40px Segoe UI, sans-serif";
    ctx.fillText(p.name,74,65,580);
    ctx.font="500 26px Segoe UI, sans-serif";ctx.fillStyle="#a4bfcb";
    ctx.fillText(p.job.replace(" • "," · "),74,111,595);
    ctx.textAlign="right";ctx.font="700 22px Segoe UI, sans-serif";ctx.fillStyle=c;
    ctx.fillText(status==="active"?"ATIVO":status==="inactive"?"INATIVO":status==="failed"?"ERRO":"SEM DADOS",680,137);
    texture.needsUpdate=true;
  }
  function setStatus(status){
    current=["active","inactive","failed"].includes(status)?status:"unknown";
    const c=current==="active"?0x86e9b0:current==="inactive"?0xffb992:current==="failed"?0xf49399:0xa5b8c8;
    statusOrbit.material.color.set(c);statusOrbit.material.emissive.set(c);
    mouths.smile.visible=current==="active";mouths.neutral.visible=current==="unknown";mouths.frown.visible=current==="inactive"||current==="failed";
    label(current);
  }
  setStatus(p.status||"unknown");
  function update(t){
    const phase=(options.index||0)*1.72+((p.id.length||3)%3);
    const s=Math.sin(t*1.35+phase);
    // All states are symbolic, driven by REAL check state only.
    body.position.y=current==="inactive"?Math.sin(t*.7+phase)*.012:s*.034;
    torso.scale.y=1+Math.sin(t*1.5+phase)*.013;
    headRig.rotation.z=current==="failed"?Math.sin(t*2.8)*.14:Math.sin(t*.6+phase)*.055;
    headRig.rotation.x=current==="inactive"?.24:current==="failed"?-.12:Math.sin(t*.55+phase)*.05;
    for(const item of shoulders){
      if(current==="active"){
        item.shoulder.rotation.x=-.30+Math.sin(t*3+phase+item.side)*.07;
        item.shoulder.rotation.z=item.side*.2;
        item.elbow.rotation.x=-.38+Math.sin(t*6+phase+item.side)*.09;
      }else if(current==="failed"){
        item.shoulder.rotation.z=item.side*(-.45+Math.sin(t*3)*.08);
        item.shoulder.rotation.x=-.32;item.elbow.rotation.x=-.12;
      }else{
        item.shoulder.rotation.z=item.side*.2;item.shoulder.rotation.x=Math.sin(t*.9+phase)*.06;
        item.elbow.rotation.x=-.03;
      }
    }
    for(let i=0;i<2;i++){
      legs[i].hip.rotation.x=(current==="active"?Math.sin(t*1.25+phase+i*Math.PI)*.045:0);
      legs[i].knee.rotation.x=current==="inactive"?.07:0;
    }
    let blink=1;
    const bt=(t+phase*3.4)%5.4;
    if(current==="inactive")blink=.08;
    else if(bt>5.18&&bt<5.36)blink=.08+.92*Math.abs(5.27-bt)/.09;
    for(const item of eyes){
      item.eye.scale.y=Math.max(.06,blink);
      item.eyebrow.rotation.z=current==="failed"?item.side*.28:0;
    }
    statusOrbit.scale.setScalar(current==="failed"?1+Math.sin(t*5)*.19:1+.08*Math.sin(t*1.3));
  }
  return{root,update,setStatus,get status(){return current},id:p.id};
}
