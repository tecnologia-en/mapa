/* Control Center v0.2: entrada direta, grupos recolhíveis, foco por sala e pets reais. */
const $=id=>document.getElementById(id);
const runtime={world:null,connected:false,model:null,ws:null,attempt:0,retry:null,started:false,selection:null,isolatedRoom:null,lastHeartbeat:0,booting:false,hoverAt:0};
function el(tag,cls,value){const x=document.createElement(tag);if(cls)x.className=cls;if(value!==undefined)x.textContent=String(value);return x;}
function text(id,value){const node=$(id);if(node)node.textContent=String(value??"—");}
function serviceLabel(s){return({active:"Ativo no servidor",inactive:"Serviço inativo",failed:"Serviço em falha",unknown:"Não verificado",activating:"Iniciando",deactivating:"Encerrando"})[s]||"Não verificado";}
function petLabel(s){return({online:"Online · sentado",offline:"Offline · dormindo",unknown:"Sem sinal confiável"})[s]||"Sem sinal confiável";}
function stateClass(s){return s==="active"||s==="online"?"active":s==="inactive"||s==="offline"||s==="failed"?"inactive":"unknown";}
function details(items){const root=$("detailRows");root.replaceChildren();for(const [key,value] of items){const line=el("div","detail-row");line.append(el("span","",key),el("b","",value));root.append(line);}}
function lookupPerson(id){for(const room of runtime.model?.rooms||[]){const person=(room.people||[]).find(p=>p.id===id);if(person)return{room,person};}return null;}
function lookupPet(id){return(runtime.model?.pets||[]).find(p=>p.id===id);}
function prettyLastSeen(iso){if(!iso)return"Sem registro recente";const d=new Date(iso);return Number.isFinite(d.getTime())?d.toLocaleString("pt-BR"):"Sem registro recente";}
function currentRoom(){return runtime.selection?.kind==="room"?runtime.selection.id:null;}
function defaultDetail(){
 text("detailType","VISÃO GERAL");text("detailTitle","Escritório Enfoque");text("detailDescription","Explore as salas e o quintal para conhecer os projetos e computadores cadastrados.");
 text("detailEmblem","✧");text("detailStatus",runtime.model?.connected?"VPS conectada":"Aguardando VPS");
 $("detailDot").className="status-indicator "+(runtime.model?.connected?"active":"unknown");
 text("detailChecked",runtime.model?.connected?"Os status dos serviços vêm da VPS.":"Os status não serão inventados sem conexão.");
 details([["Ambientes",String(runtime.model?.rooms?.length||2)],["Funcionários",String((runtime.model?.rooms||[]).reduce((n,r)=>n+(r.people?.length||0),0))],["Pets cadastrados",String(runtime.model?.petSummary?.total||0)],["Acesso","Somente leitura"]]);
 $("teamFocusActions").hidden=true;
}
function updateFocusButtons(){
 const id=currentRoom();
 const show=!!id;
 $("teamFocusActions").hidden=!show;
 $("exitFocusBtn").hidden=!runtime.isolatedRoom;
 if(show){text("focusTeamBtn",runtime.isolatedRoom===id?"↩  Sair do foco":"◎  Focar esta equipe");
   $("focusTeamBtn").classList.toggle("is-focused",runtime.isolatedRoom===id);}
}
function select(item,fly=false){
 if(!runtime.world||!runtime.model||!item)return;
 runtime.selection=item;
 document.querySelectorAll(".room-button,.person-button,.pet-group-button").forEach(n=>n.classList.toggle("selected",n.dataset.id===item.id));
 if(item.kind==="room"){
   const room=runtime.model.rooms.find(r=>r.id===item.id);if(!room)return;
   text("detailType","EQUIPE · SALA DO PROJETO");text("detailTitle",room.name);text("detailDescription",room.description);
   text("detailEmblem",room.id==="enfoque-os"?"◇":"▦");
   const members=room.people||[];
   text("detailStatus",runtime.model.connected?members.filter(p=>p.status==="active").length+" de "+members.length+" serviços ativos":"Serviços não verificados");
   $("detailDot").className="status-indicator "+(runtime.model.connected?"active":"unknown");
   text("detailChecked",runtime.model.connected?"Verificado diretamente na VPS.":"Sem conexão, estados não verificados.");
   details([["Equipe",room.name],["Integrantes",String(members.length)],["Computadores",room.id==="enfoque-os"?String(runtime.model.pets?.length||0):"—"],["Visibilidade","Use Focar equipe para isolar"],["Operações","Somente leitura"]]);
   text("worldTitle",runtime.isolatedRoom===room.id?room.name+" · em foco":room.name);
 }else if(item.kind==="pet"){
   const p=lookupPet(item.id);if(!p)return;
   text("detailType","PET · COMPUTADOR");text("detailTitle",p.name);
   text("detailDescription","Um pet representa um equipamento aprovado. O dono indica a loja ou empresa associada.");
   text("detailEmblem","♧");text("detailStatus",petLabel(p.status));
   $("detailDot").className="status-indicator "+stateClass(p.status);
   text("detailChecked",p.status==="unknown"?"Sem informação atual para confirmar a conexão.": "Status obtido do sinal do agente na VPS.");
   details([["Dono / loja",p.owner],["Computador",p.name],["Conexão",petLabel(p.status)],["Último sinal",prettyLastSeen(p.lastSeenAt)],["Verificação","Sem comandos enviados ao PC"]]);
   text("worldTitle","Pátio dos agentes · "+p.name);
 }else{
   const match=lookupPerson(item.id);if(!match)return;const {room,person:p}=match;
   text("detailType",p.kind==="chief"?"CHEFE DE PROJETO":"FUNCIONÁRIO");text("detailTitle",p.name);text("detailDescription",p.description||p.job);
   text("detailEmblem",p.kind==="chief"?"♛":"♟");
   text("detailStatus",serviceLabel(p.status||"unknown"));
   $("detailDot").className="status-indicator "+stateClass(p.status);
   text("detailChecked",p.checkedAt?"Verificado às "+prettyLastSeen(p.checkedAt):"Sem verificação recente");
   details([["Equipe",room.name],["Cargo",p.job],["Check",p.check_id],["Execução","Serviço systemd"],["Operações","Desabilitadas"]]);
   text("worldTitle",room.name+" / "+p.name);
 }
 updateFocusButtons();
 if(fly)runtime.world.focus(item.kind,item.id);
}
function overview(){
 if(!runtime.world)return;
 runtime.isolatedRoom=null;runtime.world.isolateRoom(null);
 runtime.selection=null;
 text("worldTitle","Escritório Enfoque");
 document.querySelectorAll(".selected").forEach(x=>x.classList.remove("selected"));
 defaultDetail();updateFocusButtons();$("tooltip").hidden=true;
}
function isolate(){
 const id=currentRoom();if(!id||!runtime.world)return;
 if(runtime.isolatedRoom===id){overview();return;}
 runtime.world.isolateRoom(id);runtime.isolatedRoom=id;
 text("worldTitle",id==="enfoque-os"?"Enfoque OS · em foco":"Infraestrutura · em foco");
 updateFocusButtons();
}
function statusBadge(s){const b=el("span","tiny-state "+stateClass(s));b.setAttribute("aria-label",serviceLabel(s));return b;}
function renderNav(){
 const rooms=runtime.model?.rooms||[],root=$("roomNav"),people=$("personNav");
 root.replaceChildren();people.replaceChildren();
 text("roomCount",String(rooms.length).padStart(2,"0"));
 text("personCount",String(rooms.reduce((n,r)=>n+(r.people?.length||0),0)).padStart(2,"0"));
 for(const [index,room]of rooms.entries()){
   const b=el("button","room-button");b.type="button";b.dataset.id=room.id;b.title="Ir até "+room.name;
   const symbol=el("span","room-swatch",index===0?"◇":"▦");symbol.style.color=room.accent||"#9de9c1";
   const txt=el("span","nav-copy");txt.append(el("strong","",room.name),el("small","",""));
   txt.lastChild.textContent=(room.people?.length||0)+" integrantes";
   b.append(symbol,txt,el("span","chev","›"));
   b.addEventListener("click",()=>select({kind:"room",id:room.id},true));root.append(b);
   for(const p of room.people||[]){
     const row=el("button","person-button");row.type="button";row.dataset.id=p.id;row.title=p.name;
     const avatar=el("span","person-avatar",p.kind==="chief"?"♛":p.name.slice(0,1));
     avatar.style.background=p.shirt||"#86b4c1";
     const info=el("span","nav-copy");info.append(el("strong","",p.name),el("small","",p.kind==="chief"?"Chefe":room.name));
     row.append(avatar,info,statusBadge(p.status));row.addEventListener("click",()=>select({kind:"person",id:p.id},true));people.append(row);
   }
 }
 const pets=runtime.model?.pets||[];
 text("petCount",String(pets.length));
 text("petsOnline",String(runtime.model?.petSummary?.online||0));
 const petList=$("petGroupList");petList.replaceChildren();
 if(!pets.length){petList.append(el("p","pet-empty",runtime.model?.petsAvailable?"Nenhum agente aprovado.":"Pets aguardando sincronização com a VPS."));}
 else{
   const grouped=new Map();for(const p of pets){if(!grouped.has(p.owner))grouped.set(p.owner,[]);grouped.get(p.owner).push(p);}
   for(const [owner,items]of grouped){
      const group=el("div","pet-store");
      const head=el("div","pet-store-head");head.append(el("strong","",owner),el("span","",items.length+" PCs"));
      group.append(head);
      for(const pet of items){
         const b=el("button","pet-group-button");b.dataset.id=pet.id;b.type="button";b.title=pet.name+" • "+petLabel(pet.status);
         b.append(el("span","pet-emoji",pet.id.charCodeAt(pet.id.length-1)%3===0?"🐈":"🐕"),el("span","pet-label",pet.name));
         const dot=el("span","tiny-state "+stateClass(pet.status));b.append(dot);
         b.addEventListener("click",()=>select({kind:"pet",id:pet.id},true));group.append(b);
      }petList.append(group);
   }
 }
 if(runtime.selection){
   document.querySelectorAll(".room-button,.person-button,.pet-group-button").forEach(n=>n.classList.toggle("selected",n.dataset.id===runtime.selection.id));
 }
 filterPeople();
}
function filterPeople(){
 const query=$("search").value.toLocaleLowerCase("pt-BR").trim();
 for(const b of $("personNav").children)b.hidden=!!query&&!b.textContent.toLocaleLowerCase("pt-BR").includes(query);
 for(const b of $("roomNav").children)b.hidden=!!query&&!b.textContent.toLocaleLowerCase("pt-BR").includes(query);
 for(const group of $("petGroupList").children){
   let matches=false;
   for(const child of group.querySelectorAll(".pet-group-button")){child.hidden=!!query&&!child.textContent.toLocaleLowerCase("pt-BR").includes(query)&&!group.querySelector(".pet-store-head")?.textContent.toLocaleLowerCase("pt-BR").includes(query);if(!child.hidden)matches=true;}
   group.hidden=!!query&&!matches;
 }
}
function connection(connected,message){
 runtime.connected=connected;
 $("connectionPill").className="head-pill"+(connected?" online":" offline");
 text("connectionText",connected?"VPS conectada":"VPS sem conexão");
 text("sourceText",connected?"Fonte: Enfoque VPS · leitura em tempo real":"Sem conexão · não verificado");
 $("sourceDot").className="source-dot"+(connected?" online":"");
 text("leftFootText",message||"Monitoramento somente leitura");
}
function apply(payload){
 if(!runtime.started||!payload||!Array.isArray(payload.rooms))return;
 runtime.model=payload;runtime.lastHeartbeat=Date.now();
 runtime.world.setData(payload);
 renderNav();
 text("activeCount",payload.summary?.active??0);
 text("inactiveCount",payload.summary?.inactive??0);
 text("unknownCount",payload.summary?.unknown??0);
 connection(!!payload.connected,payload.connectionMessage);
 if(runtime.selection)select(runtime.selection,false);else defaultDetail();
}
function stopConnection(){
 clearTimeout(runtime.retry);runtime.retry=null;runtime.attempt=0;
 if(runtime.ws){runtime.ws.onclose=null;runtime.ws.close();runtime.ws=null;}
}
function reconnect(){
 if(!runtime.started)return;
 const ws=new WebSocket("ws://"+location.host+"/ws");runtime.ws=ws;
 ws.onopen=()=>runtime.attempt=0;
 ws.onmessage=e=>{try{apply(JSON.parse(e.data));}catch(error){console.warn("Atualização inválida",error);}};
 ws.onclose=()=>{
   if(!runtime.started)return;
   runtime.attempt++;
   if(Date.now()-runtime.lastHeartbeat>25000){
     connection(false,"WebSocket desconectado");
     if(runtime.model){
       const old=JSON.parse(JSON.stringify(runtime.model));
       old.connected=false;old.petsAvailable=false;old.connectionMessage="Conexão perdida";
       old.summary={active:0,inactive:0,unknown:0};
       for(const room of old.rooms)for(const p of room.people||[]){p.status="unknown";old.summary.unknown++;}
       for(const p of old.pets||[])p.status="unknown";
       old.petSummary={total:old.pets?.length||0,online:0,offline:0,unknown:old.pets?.length||0};
       apply(old);
     }
   }
   runtime.retry=setTimeout(reconnect,Math.min(20000,2500*runtime.attempt));
 };
 ws.onerror=()=>ws.close();
}
function hover(item){
 const now=performance.now();if(now-runtime.hoverAt<110)return;runtime.hoverAt=now;
 if(!item){$("tooltip").hidden=true;return;}
 const p=item.kind==="person"?lookupPerson(item.id)?.person:null;
 const animal=item.kind==="pet"?lookupPet(item.id):null;
 const room=item.kind==="room"?runtime.model?.rooms?.find(r=>r.id===item.id):null;
 text("tooltip",p?p.name+" · "+serviceLabel(p.status):animal?animal.name+" · "+animal.owner+" · "+petLabel(animal.status):room?room.name+" · "+room.description:"");
 $("tooltip").hidden=false;
}
async function boot(){
 if(runtime.booting||runtime.started)return;
 runtime.booting=true;$("sceneLoading").hidden=false;$("launchError").hidden=true;
 try{
   const [{World},response]=await Promise.all([import("./world.js"),fetch("/api/state",{cache:"no-store"})]);
   if(!response.ok)throw Error("API local não respondeu");
   const data=await response.json();
   const world=new World({mount:$("scene"),onSelect:item=>select(item),onFocus:item=>select(item),onHover:hover});
   runtime.world=world;runtime.started=true;
   apply(data);reconnect();
 }catch(error){
   console.error("Falha ao iniciar Mapa",error);
   if(runtime.world){runtime.world.dispose();runtime.world=null;}
   runtime.started=false;
   text("launchErrorText",error.message||"Confira o WebGL e o servidor local.");
   $("launchError").hidden=false;
 }finally{runtime.booting=false;$("sceneLoading").hidden=true;}
}
function toggleSidebar(){
 const ws=$("workspace"),collapse=!ws.classList.contains("sidebar-collapsed");
 ws.classList.toggle("sidebar-collapsed",collapse);
 $("sidebarToggle").setAttribute("aria-expanded",String(!collapse));
 $("sidebarToggle").setAttribute("aria-label",collapse?"Expandir barra lateral":"Recolher barra lateral");
 $("sidebarToggle").title=collapse?"Expandir menu":"Recolher menu";
}
$("sidebarToggle").addEventListener("click",toggleSidebar);
$("focusTeamBtn").addEventListener("click",isolate);
$("exitFocusBtn").addEventListener("click",overview);
$("headerOverview").addEventListener("click",overview);
$("returnBtn").addEventListener("click",overview);
$("reset").addEventListener("click",overview);
$("retryLaunchBtn").addEventListener("click",boot);
$("fov").addEventListener("input",e=>{text("fovValue",e.target.value+"°");runtime.world?.fov(e.target.value);});
$("quality").addEventListener("click",e=>{
 const high=e.target.dataset.high!=="true";e.target.dataset.high=String(high);
 text("quality",high?"QUALIDADE: ALTA":"QUALIDADE: LEVE");
 runtime.world?.setQuality(high);
});
$("search").addEventListener("input",filterPeople);
document.addEventListener("keydown",e=>{
 if(e.key==="/"&&document.activeElement!==$("search")){e.preventDefault();if($("workspace").classList.contains("sidebar-collapsed"))toggleSidebar();$("search").focus();}
 if(e.key==="Escape"&&runtime.isolatedRoom)overview();
});
boot();
