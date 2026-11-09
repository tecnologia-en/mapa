/* Mapa v0.3 — dois andares, sidebar única por lado, estante frontal e ocultação local.
 * Nunca envia operações de gravação à VPS. */
const $=id=>document.getElementById(id);
const state={
  world:null,model:null,started:false,booting:false,ws:null,retry:null,attempt:0,lastHeartbeat:0,
  selected:null,hidden:new Set(),rightOpen:false,leftOpen:false,hovered:null
};
const STORAGE_KEY="enfoque-mapa-visual-hidden-v3";
try{
  const raw=JSON.parse(window.localStorage.getItem(STORAGE_KEY)||"[]");
  if(Array.isArray(raw))state.hidden=new Set(raw.filter(x=>typeof x==="string"&&x.length<170).slice(0,1000));
}catch(_){}
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e;};
const text=(id,txt)=>{const node=$(id);if(node)node.textContent=String(txt??"—");};
function statusClass(s){return s==="online"||s==="active"?"active":s==="offline"||s==="inactive"||s==="failed"?"inactive":"unknown";}
function serviceStatus(s){return({active:"Ativo",inactive:"Inativo",failed:"Falha",activating:"Iniciando",deactivating:"Parando",unknown:"Não verificado"})[s]||"Não verificado";}
function computerStatus(s){return({online:"Agente conectado",offline:"Agente desconectado",unknown:"Sem sinal confirmado"})[s]||"Sem sinal confirmado";}
function persistHidden(){
  try{window.localStorage.setItem(STORAGE_KEY,JSON.stringify([...state.hidden]));}catch(_){}
  state.world?.setHidden(state.hidden);renderHidden();
  if(state.selected)renderDetail(state.selected);
}
function hideKey(item){
  if(!item)return null;
  if(item.kind==="seat"||item.kind==="person")return"person:"+item.id;
  if(item.kind==="shelf")return"shelf:computadores";
  return ["room","page","computer","store","department"].includes(item.kind)?item.kind+":"+item.id:null;
}
function toggleHidden(item){
  const key=hideKey(item);if(!key)return;
  if(state.hidden.has(key))state.hidden.delete(key);else state.hidden.add(key);
  persistHidden();
  if(item.kind==="shelf"&&state.hidden.has(key)&&state.world?.view==="shelf")exitShelf();
}
function findPerson(id){
  for(const room of state.model?.rooms||[]){
    const person=(room.people||[]).find(p=>p.id===id);
    if(person)return{room,person};
  }
  return null;
}
function findPage(id){
  for(const dep of state.model?.intranet||[]){
    const page=(dep.pages||[]).find(p=>p.id===id);
    if(page)return{department:dep,page};
  }
  return null;
}
function findComputer(id){return(state.model?.computers||[]).find(x=>x.id===id);}
function findDepartment(id){return(state.model?.intranet||[]).find(x=>x.id===id);}
function getName(item){
  if(!item)return"";
  if(item.kind==="room")return state.model?.rooms?.find(x=>x.id===item.id)?.name||"Sala";
  if(item.kind==="person"||item.kind==="seat")return findPerson(item.id)?.person?.name||"Funcionário";
  if(item.kind==="page")return findPage(item.id)?.page?.name||"Página";
  if(item.kind==="department")return findDepartment(item.id)?.name||"Área";
  if(item.kind==="computer")return findComputer(item.id)?.name||"Computador";
  if(item.kind==="store")return item.id;
  if(item.kind==="shelf")return"Computadores";
  return"Item";
}
function decodeHiddenKey(key){
  const idx=key.indexOf(":");if(idx<1)return null;
  return {kind:key.slice(0,idx),id:key.slice(idx+1)};
}
function renderHidden(){
  const root=$("hiddenNav");root.replaceChildren();
  text("hiddenCount",state.hidden.size);
  const entries=[...state.hidden].map(key=>({key,item:decodeHiddenKey(key)})).filter(x=>x.item);
  if(!entries.length){root.append(el("p","hidden-empty","Nada oculto."));return;}
  for(const {key,item}of entries){
    const button=el("button","hidden-item");button.type="button";
    button.title="Restaurar "+getName(item);
    button.append(el("span","",getName(item)),el("em","","Mostrar"));
    button.lastChild.textContent="Mostrar";
    button.addEventListener("click",()=>{state.hidden.delete(key);persistHidden();});
    root.append(button);
  }
}
function navItem(name,kind,id,status){
  const btn=el("button","nav-item");btn.type="button";btn.title=name;btn.dataset.entity=kind+":"+id;
  const dot=el("span","dot "+statusClass(status));
  btn.append(dot,el("span","name",name));
  btn.addEventListener("click",()=>select({kind,id},true));return btn;
}
function renderNav(){
  const rooms=state.model?.rooms||[],intranet=state.model?.intranet||[];
  const roomRoot=$("roomNav"),personRoot=$("personNav"),departmentRoot=$("departmentNav");
  roomRoot.replaceChildren();personRoot.replaceChildren();departmentRoot.replaceChildren();
  text("roomCount",rooms.length);
  text("personCount",rooms.reduce((acc,r)=>acc+(r.people?.length||0),0));
  text("pageCount",intranet.reduce((acc,d)=>acc+(d.pages?.length||0),0));
  for(const room of rooms){
    roomRoot.append(navItem(room.name,"room",room.id,"unknown"));
    personRoot.append(el("div","nav-group-name",room.name));
    for(const p of room.people||[])personRoot.append(navItem(p.name,"person",p.id,p.status));
  }
  for(const dep of intranet){
    const wrapper=el("div","dept-wrap"),details=el("details");
    const summary=el("summary");
    summary.append(el("span","",dep.name),el("small","",(dep.pages||[]).length+" páginas"));
    details.append(summary);
    const pages=el("div","dept-pages");
    const focus=el("button","","◎ Ver área "+dep.name);focus.type="button";
    focus.addEventListener("click",()=>select({kind:"department",id:dep.id},true));
    pages.append(focus);
    for(const pg of dep.pages||[]){
      const btn=el("button","",pg.name);btn.type="button";
      btn.title=pg.name;btn.addEventListener("click",()=>select({kind:"page",id:pg.id},true));
      pages.append(btn);
    }
    details.append(pages);wrapper.append(details);departmentRoot.append(wrapper);
  }
  text("computerCount",(state.model?.computers||[]).length);
  text("activeCount",state.model?.summary?.active||0);
  renderHidden();
  markSelection();
}
function markSelection(){
  const key=state.selected?state.selected.kind+":"+state.selected.id:"";
  document.querySelectorAll("[data-entity]").forEach(n=>n.classList.toggle("selected",n.dataset.entity===key));
}
function meta(rows){
  const root=$("detailMeta");root.replaceChildren();
  for(const [a,b]of rows){
    const line=el("div","meta-row");line.append(el("span","",a),el("strong","",b));root.append(line);
  }
}
function resetDetail(){
  state.selected=null;
  text("detailType","MAPA");text("detailTitle","Selecione algo");
  text("detailDescription","Explore uma sala, uma mesa, uma área ou a estante.");
  text("detailStatus","Sem seleção");
  $("detailDot").className="status-circle unknown";
  $("focusTeamBtn").hidden=true;$("hideBtn").hidden=true;
  meta([]);
  markSelection();
}
function renderDetail(item){
  if(!item||!state.model){resetDetail();return;}
  const k=hideKey(item),hidden=k&&state.hidden.has(k);
  const name=getName(item),rows=[];
  let status="";let type="";let description="";
  if(item.kind==="room"){
    const room=state.model.rooms.find(r=>r.id===item.id);
    if(!room){resetDetail();return;}
    type="SALA";description=room.description;
    const alive=(room.people||[]).filter(p=>p.status==="active").length;
    status=state.model.connected?alive+" de "+room.people.length+" serviços ativos":"Não verificado";
    rows.push(["Andar","1º"],["Integrantes",String(room.people.length)]);
  }else if(item.kind==="person"||item.kind==="seat"){
    const match=findPerson(item.id);if(!match){resetDetail();return;}
    const {person:p,room}=match;
    type=p.kind==="chief"?"CHEFE":"FUNCIONÁRIO";description=p.description||p.job;
    status=serviceStatus(p.status);
    rows.push(["Sala",room.name],["Função",p.job]);
  }else if(item.kind==="shelf"){
    type="ESTANTE";description="Cada prateleira representa uma loja. Cada livro representa um computador.";
    status=(state.model.computers||[]).length+" computadores";
    rows.push(["Andar","1º"],["Navegação","Scroll para trocar lojas"]);
  }else if(item.kind==="store"){
    type="LOJA";description="Prateleira vinculada à loja ou empresa, apenas visual.";
    const count=(state.model.computers||[]).filter(c=>c.owner===item.id).length;
    status=count+" computadores";rows.push(["Loja",item.id]);
  }else if(item.kind==="computer"){
    const c=findComputer(item.id);if(!c){resetDetail();return;}
    type="COMPUTADOR";description="Um livro representa uma estação cadastrada no servidor.";
    status=computerStatus(c.status);rows.push(["Loja",c.owner],["Último sinal",c.lastSeenAt?new Date(c.lastSeenAt).toLocaleString("pt-BR"):"Indisponível"]);
  }else if(item.kind==="department"){
    const d=findDepartment(item.id);if(!d){resetDetail();return;}
    type="ÁREA · INTRANET";description="Divisória do 2º andar, com páginas reais da Intranet.";
    status=(d.pages||[]).length+" páginas";rows.push(["Andar","2º"]);
  }else if(item.kind==="page"){
    const match=findPage(item.id);if(!match){resetDetail();return;}
    type="PÁGINA · INTRANET";description="Funcionário que representa uma página HTML existente.";
    status="Cadastrada no mapa";rows.push(["Área",match.department.name],["Rota",match.page.path]);
  }else{resetDetail();return;}
  state.selected=item;
  text("detailType",type);text("detailTitle",name);
  text("detailDescription",description);
  text("detailStatus",hidden?"Oculto neste mapa":status);
  $("detailDot").className="status-circle "+(hidden?"unknown":statusClass(
    item.kind==="computer"?findComputer(item.id)?.status:
    item.kind==="person"||item.kind==="seat"?findPerson(item.id)?.person?.status:
    "active"));
  meta(rows);
  $("focusTeamBtn").hidden=item.kind!=="room";
  if(item.kind==="room")text("focusTeamBtn",state.world?.isolatedRoom===item.id?"↩ Ver todas as salas":"◎ Focar equipe");
  $("hideBtn").hidden=!k;
  if(k)text("hideBtn",hidden?"◎ Mostrar novamente":"◌ Ocultar no mapa");
  markSelection();
}
function setRight(open){
  state.rightOpen=Boolean(open);
  $("workspace").classList.toggle("right-collapsed",!state.rightOpen);
  $("rightToggle").setAttribute("aria-expanded",String(state.rightOpen));
  $("rightToggle").setAttribute("aria-label",state.rightOpen?"Recolher detalhes":"Abrir detalhes");
  $("rightToggle").title=state.rightOpen?"Recolher detalhes":"Expandir detalhes";
}
function setLeft(open){
  state.leftOpen=Boolean(open);
  $("workspace").classList.toggle("left-collapsed",!state.leftOpen);
  $("leftToggle").setAttribute("aria-expanded",String(state.leftOpen));
  $("leftToggle").setAttribute("aria-label",state.leftOpen?"Recolher menu":"Abrir menu");
  $("leftToggle").title=state.leftOpen?"Recolher menu":"Expandir menu";
}
function updateFloorUI(){
  const world=state.world;if(!world)return;
  const isShelf=world.view==="shelf";
  text("floorTitle",world.currentFloor+"º ANDAR");
  text("modeTitle",isShelf?"Estante de computadores":world.currentFloor===1?"Sistemas & Infraestrutura":"Intranet");
  text("sceneTitle",isShelf?"Estante · Computadores":world.currentFloor===1?"Primeiro andar":"Intranet · Segundo andar");
  text("sceneHint",isShelf?"Passe o mouse nos livros · Scroll troca a loja · Esc volta":world.currentFloor===1?"Arraste para girar · Scroll para zoom · ↑ sobe um andar":"Arraste para girar · Scroll para zoom · ↓ desce um andar");
  $("shelfModeHint").hidden=!isShelf;
  $("shelfExit").hidden=!isShelf;
  $("focusExit").hidden=!world.isolatedRoom||isShelf;
  for(const node of document.querySelectorAll("[data-floor]"))node.classList.toggle("active",Number(node.dataset.floor)===world.currentFloor);
}
function select(item,fly=true){
  if(!state.world||!state.model)return;
  if(fly){
    state.world.focus(item.kind,item.id);
    updateFloorUI();
  }
  renderDetail(item);setRight(true);
}
function goFloor(n){
  if(!state.world)return;
  state.world.setFloor(n);resetDetail();updateFloorUI();
}
function overview(){
  if(!state.world)return;
  if(state.world.view==="shelf")state.world.exitShelf();
  state.world.isolatedRoom=null;state.world.view="world";
  state.world.updateFloorVisibility();state.world.reset();
  resetDetail();updateFloorUI();
}
function exitShelf(){
  state.world?.exitShelf();resetDetail();updateFloorUI();
}
function connection(isLive,why){
  $("connectionPill").className="connection"+(isLive?" online":" offline");
  text("connectionText",isLive?"VPS conectada":"VPS sem conexão");
  text("sourceText",isLive?"Estado consultado na VPS":"Estado não confirmado");
  $("sourceDot").className="mini-status"+(isLive?" online":"");
  text("sceneState",isLive?"● MONITORADO":"● SEM SINAL");
}
function apply(data){
  if(!state.world||!data||!Array.isArray(data.rooms))return;
  state.model=data;state.lastHeartbeat=Date.now();
  state.world.setData(data);state.world.setHidden(state.hidden);
  connection(Boolean(data.connected),data.connectionMessage);
  renderNav();
  if(state.selected)renderDetail(state.selected);else resetDetail();
  updateFloorUI();
}
function websocket(){
  if(!state.started)return;
  const ws=new WebSocket((location.protocol==="https:"?"wss://":"ws://")+location.host+"/ws");state.ws=ws;
  ws.onopen=()=>{state.attempt=0;};
  ws.onmessage=e=>{try{apply(JSON.parse(e.data));}catch(error){console.warn("Falha ao atualizar o mapa",error);}};
  ws.onclose=()=>{
    if(!state.started)return;state.attempt++;
    if(Date.now()-state.lastHeartbeat>24000){
      connection(false,"Conexão temporariamente perdida");
      if(state.model){
        const stale=JSON.parse(JSON.stringify(state.model));
        stale.connected=false;stale.computersAvailable=false;
        for(const room of stale.rooms)for(const person of room.people||[])person.status="unknown";
        for(const c of stale.computers||[])c.status="unknown";
        stale.summary={active:0,inactive:0,unknown:stale.rooms.reduce((n,r)=>n+r.people.length,0)};
        apply(stale);
      }
    }
    state.retry=setTimeout(websocket,Math.min(20000,2200*state.attempt));
  };
  ws.onerror=()=>ws.close();
}
function tooltip(item,cx,cy){
  if(!item||!state.world){$("tooltip").hidden=true;return;}
  const now=performance.now();if(item.kind!=="computer"&&item.kind!=="page"&&item.kind!=="store"&&item.kind!=="department"&&item.kind!=="seat"&&item.kind!=="shelf"){ $("tooltip").hidden=true;return;}
  const name=getName(item);
  const hiddenKey=hideKey(item),suffix=state.hidden.has(hiddenKey)?" · Oculto":"";
  text("tooltip",name+suffix);
  const container=$("scene").getBoundingClientRect(),t=$("tooltip");
  const x=Math.max(12,Math.min(cx-container.left+14,container.width-245));
  const y=Math.max(96,Math.min(cy-container.top+19,container.height-53));
  t.style.left=x+"px";t.style.top=y+"px";t.hidden=false;
}
async function boot(){
  if(state.started||state.booting)return;
  state.booting=true;$("sceneLoading").hidden=false;$("launchError").hidden=true;
  try{
    const [{World},response]=await Promise.all([import("./world.js"),fetch("/api/state",{cache:"no-store"})]);
    if(!response.ok)throw Error("O servidor local não respondeu");
    const data=await response.json();
    state.world=new World({
      mount:$("scene"),
      onSelect:item=>select(item,true),
      onFocus:item=>select(item,false),
      onHover:tooltip
    });
    state.started=true;apply(data);resetDetail();updateFloorUI();websocket();
  }catch(error){
    console.error("Falha ao iniciar o Mapa",error);
    state.world?.dispose();state.world=null;state.started=false;
    text("launchErrorText",error.message||"Confira se o navegador suporta WebGL.");
    $("launchError").hidden=false;
  }finally{$("sceneLoading").hidden=true;state.booting=false;}
}
$("leftToggle").addEventListener("click",()=>setLeft(!state.leftOpen));
$("rightToggle").addEventListener("click",()=>setRight(!state.rightOpen));
for(const button of document.querySelectorAll("[data-floor]")){
  button.addEventListener("click",()=>goFloor(Number(button.dataset.floor)));
}
$("shelfNav").addEventListener("click",()=>select({kind:"shelf",id:"computadores"},true));
$("focusTeamBtn").addEventListener("click",()=>{
  const item=state.selected;if(!item||item.kind!=="room")return;
  const on=state.world?.isolatedRoom!==item.id;
  state.world.isolateRoom(on?item.id:null);
  renderDetail(item);updateFloorUI();
});
$("hideBtn").addEventListener("click",()=>toggleHidden(state.selected));
$("shelfExit").addEventListener("click",exitShelf);
$("focusExit").addEventListener("click",overview);
$("resetView").addEventListener("click",()=>{if(state.world?.view==="shelf")exitShelf();else overview();});
$("retryBtn").addEventListener("click",boot);
$("fov").addEventListener("input",e=>{text("fovValue",e.target.value+"°");state.world?.fov(e.target.value);});
$("quality").addEventListener("click",e=>{
  const high=e.target.dataset.high!=="true";e.target.dataset.high=String(high);
  text("quality",high?"Qualidade: alta":"Qualidade: leve");state.world?.setQuality(high);
});
document.addEventListener("keydown",e=>{
  if(e.altKey||e.ctrlKey||e.metaKey||["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName))return;
  if(e.key==="ArrowUp"){e.preventDefault();goFloor(2);}
  if(e.key==="ArrowDown"){e.preventDefault();goFloor(1);}
  if(e.key==="1"||e.key==="2"){goFloor(Number(e.key));}
  if(e.key==="Escape"){if(state.world?.view==="shelf")exitShelf();else if(state.world?.isolatedRoom)overview();}
});
setLeft(false);setRight(false);
boot();
