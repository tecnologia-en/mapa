/* Entrada do Mapa: nenhum WebGL é criado antes de clicar INICIAR. */
const $=id=>document.getElementById(id);
const runtime={world:null,connected:false,model:null,ws:null,attempt:0,retry:null,started:false,selection:null,lastHeartbeat:0,World:null};
function element(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function text(id,value){$(id).textContent=String(value??"—");}
function statusLabel(s){return({active:"Ativo no servidor",inactive:"Serviço inativo",failed:"Serviço em falha",unknown:"Não verificado",activating:"Iniciando",deactivating:"Encerrando"})[s]||"Não verificado";}
function stateClass(s){return s==="active"?"active":s==="inactive"||s==="failed"?"inactive":"unknown";}
function rows(items){const container=$("detailRows");container.replaceChildren();for(const [key,value]of items){const line=element("div","detail-row");line.append(element("span","",key),element("b","",value));container.append(line);}}
function personData(id){for(const room of runtime.model?.rooms||[]){const p=(room.people||[]).find(x=>x.id===id);if(p)return{room,p};}return null;}
function defaultDetail(){text("detailType","VISÃO GERAL");text("detailTitle","Bem-vindo ao Mapa.");text("detailDescription","Selecione uma sala ou personagem. Os status apresentados são verificados na VPS.");text("detailEmblem","✧");text("detailStatus",runtime.model?.connected?"Serviços monitorados":"Aguardando VPS");$("detailDot").className="status-indicator unknown";text("detailChecked",runtime.model?.connected?"Conexão somente leitura com o servidor.":"Nenhum estado será inventado sem conexão.");rows([["Salas","2 ambientes"],["Personagens","6 membros da equipe"],["Integração","Somente leitura"]]);}
function select(item,fly=false){
  if(!runtime.world||!runtime.model)return;
  runtime.selection=item;
  document.querySelectorAll(".room-button, .person-button").forEach(n=>n.classList.toggle("selected",n.dataset.id===item.id));
  if(item.kind==="room"){
    const r=(runtime.model.rooms||[]).find(x=>x.id===item.id);if(!r)return;
    text("detailType","SALA DO PROJETO");text("detailTitle",r.name);text("detailDescription",r.description);
    text("detailEmblem",r.id==="enfoque-os"?"◇":"▦");
    text("detailStatus","Monitorando "+(r.people?.length||0)+" serviços");
    $("detailDot").className="status-indicator "+(runtime.model.connected?"active":"unknown");
    text("detailChecked",runtime.model.connected?"Informações verificadas na VPS.":"Aguardando conexão com a VPS.");
    rows([["Área",r.name],["Personagens",String(r.people?.length||0)],["Tipo","Projeto + componentes"],["Ações","Desabilitadas"]]);
    text("worldTitle",r.name);
  }else{
    const itemData=personData(item.id);if(!itemData)return;
    const {room,p}=itemData;const s=p.status||"unknown";
    text("detailType",p.kind==="chief"?"CHEFE DE PROJETO":"FUNCIONÁRIO");
    text("detailTitle",p.name);text("detailDescription",p.description||p.job);
    text("detailEmblem",p.kind==="chief"?"♛":"♟");
    text("detailStatus",statusLabel(s));
    $("detailDot").className="status-indicator "+stateClass(s);
    text("detailChecked",p.checkedAt?"Verificado em "+new Date(p.checkedAt).toLocaleTimeString("pt-BR"):"Sem verificação recente");
    rows([["Sala",room.name],["Cargo",p.job],["Check",p.check_id],["Execução","Serviço systemd"],["Ações","Desabilitadas"]]);
    text("worldTitle",room.name+" / "+p.name);
  }
  if(fly)runtime.world.focus(item.kind,item.id);
}
function badge(state){const v=element("span","tiny-state "+stateClass(state));v.setAttribute("aria-label",statusLabel(state));return v;}
function navUpdate(){const root=$("roomNav"),people=$("personNav");root.replaceChildren();people.replaceChildren();
 const rooms=runtime.model?.rooms||[];
 text("roomCount",String(rooms.length).padStart(2,"0"));
 text("personCount",String(rooms.reduce((n,r)=>n+(r.people?.length||0),0)).padStart(2,"0"));
 for(const [i,r] of rooms.entries()){
   const btn=element("button","room-button");btn.type="button";btn.dataset.id=r.id;btn.style.setProperty("--accent",r.accent||"#86cdb7");
   const icon=element("span","room-swatch",i===0?"◇":"▦");icon.style.color=r.accent;
   const column=element("span","");column.append(element("strong","",r.name),element("small","",(r.people?.length||0)+" integrantes"));
   btn.append(icon,column,element("span","chev","›"));btn.addEventListener("click",()=>select({kind:"room",id:r.id},true));root.append(btn);
   for(const p of r.people||[]){
     const row=element("button","person-button");row.type="button";row.dataset.id=p.id;
     const portrait=element("span","person-avatar",p.kind==="chief"?"♛":p.name.slice(0,1));
     portrait.style.background=p.shirt||"#91b6ba";
     const col=element("span","");col.append(element("strong","",p.name),element("small","",p.kind==="chief"?"Chefe":r.name));
     row.append(portrait,col,badge(p.status));row.addEventListener("click",()=>select({kind:"person",id:p.id},true));people.append(row);
   }
 }
 if(runtime.selection){const item=runtime.selection;document.querySelectorAll(".room-button, .person-button").forEach(n=>n.classList.toggle("selected",n.dataset.id===item.id));}
 filterPeople();
}
function filterPeople(){const q=$("search").value.toLocaleLowerCase("pt-BR").trim();
 for(const btn of $("personNav").children){const label=btn.innerText.toLocaleLowerCase("pt-BR");btn.hidden=!!q&&!label.includes(q);}
 for(const btn of $("roomNav").children){btn.hidden=!!q&&!btn.innerText.toLocaleLowerCase("pt-BR").includes(q);}
}
function connection(on,message){runtime.connected=on;const el=$("connectionPill");el.className="head-pill"+(on?" online":" offline");text("connectionText",on?"VPS conectada":"VPS não conectada");text("sourceText",on?"Fonte: VPS Enfoque · atualização ao vivo":"Sem conexão · status desconhecidos");$("sourceDot").className="source-dot"+(on?" online":"");text("leftFootText",message||"Somente leitura");}
function apply(payload){if(!runtime.started||!payload||!Array.isArray(payload.rooms))return;
 runtime.model=payload;runtime.lastHeartbeat=Date.now();runtime.world.setData(payload);
 navUpdate();text("activeCount",payload.summary?.active??0);
 text("inactiveCount",payload.summary?.inactive??0);text("unknownCount",payload.summary?.unknown??0);
 connection(!!payload.connected,payload.connectionMessage);
 if(runtime.selection)select(runtime.selection,false);else defaultDetail();
}
async function initialState(){const res=await fetch("/api/state",{cache:"no-store"});if(!res.ok)throw Error("API local indisponível");return res.json();}
function stopConnection(){clearTimeout(runtime.retry);runtime.retry=null;runtime.attempt=0;if(runtime.ws){runtime.ws.onclose=null;runtime.ws.close();runtime.ws=null;}}
function websocket(){if(!runtime.started)return;const url="ws://"+location.host+"/ws";const ws=new WebSocket(url);runtime.ws=ws;
 ws.onopen=()=>runtime.attempt=0;
 ws.onmessage=e=>{try{apply(JSON.parse(e.data));}catch(err){console.warn("Status inválido",err);}};
 ws.onclose=()=>{if(!runtime.started)return;runtime.attempt++;if(Date.now()-runtime.lastHeartbeat>25000){connection(false,"WebSocket desconectado");if(runtime.model){const stale=JSON.parse(JSON.stringify(runtime.model));stale.connected=false;stale.connectionMessage="Conexão perdida";stale.summary={active:0,inactive:0,unknown:0};for(const room of stale.rooms)for(const p of room.people||[]){p.status="unknown";stale.summary.unknown++;}apply(stale);}}
 runtime.retry=setTimeout(websocket,Math.min(20000,2500*runtime.attempt));};
 ws.onerror=()=>ws.close();
}
async function start(){if(runtime.started)return;const btn=$("startBtn");btn.disabled=true;$("startError").hidden=true;
 $("welcome").hidden=true;$("workspace").hidden=false;$("bottomStrip").hidden=false;$("sceneLoading").hidden=false;
 try{
   const [{World},data]=await Promise.all([import("./world.js"),initialState()]);
   runtime.World=World;
   const world=new World({mount:$("scene"),onSelect:x=>select(x,false),onFocus:x=>select(x,false),onHover:x=>{if(!x){$("tooltip").hidden=true;return;}const p=x.kind==="person"?personData(x.id)?.p:null;const r=x.kind==="room"?data.rooms.find(y=>y.id===x.id):null;text("tooltip",p?(p.name+" · "+statusLabel(p.status)):r?(r.name+" · "+r.description):"");$("tooltip").hidden=false;}});
   runtime.world=world;runtime.started=true;apply(data);
   websocket();
 }catch(error){
   console.error(error);runtime.started=false;$("welcome").hidden=false;$("workspace").hidden=true;$("bottomStrip").hidden=true;
   text("startError","Não foi possível iniciar o escritório 3D. Confira se o Three.js foi instalado e se o navegador tem WebGL: "+error.message);
   $("startError").hidden=false;
 }finally{btn.disabled=false;$("sceneLoading").hidden=true;}
}
function exit(){runtime.started=false;stopConnection();runtime.world?.dispose();runtime.world=null;runtime.selection=null;
 $("workspace").hidden=true;$("bottomStrip").hidden=true;$("welcome").hidden=false;$("tooltip").hidden=true;connection(false,"Mapa parado");}
$("startBtn").addEventListener("click",start);
$("returnBtn").addEventListener("click",exit);
$("reset").addEventListener("click",()=>{runtime.world?.reset();runtime.selection=null;defaultDetail();text("worldTitle","Escritório Enfoque");document.querySelectorAll(".selected").forEach(x=>x.classList.remove("selected"));});
$("fov").addEventListener("input",e=>{const value=Number(e.target.value);text("fovValue",value+"°");runtime.world?.fov(value);});
$("quality").addEventListener("click",e=>{const high=!e.target.dataset.high||e.target.dataset.high==="false";e.target.dataset.high=String(high);text("quality",high?"QUALIDADE: ALTA":"QUALIDADE: LEVE");runtime.world?.setQuality(high);});
$("search").addEventListener("input",filterPeople);
document.addEventListener("keydown",e=>{if(e.key==="/"&&runtime.started&&document.activeElement!==$("search")){e.preventDefault();$("search").focus();}});
