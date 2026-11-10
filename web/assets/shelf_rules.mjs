/* Planejamento puro das prateleiras: não depende do Three.js ou da rede.
 * Cada loja fixa permanece, mesmo vazia; setores extras só aparecem com livros visíveis.
 */
export const FIXED_STORES = Object.freeze([
  "Centro", "Icaraí", "Itaipu", "Copacabana", "São Gonçalo", "Ilha Plaza"
]);
export const VISIBLE_ROWS = 3;
const keyOf = value => String(value || "").normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
function canonicalStore(value) {
  const key=keyOf(value);
  if(key==="centro"||key==="centro niteroi")return "Centro";
  if(key==="icarai")return "Icaraí";
  if(key==="itaipu")return "Itaipu";
  if(key==="copacabana")return "Copacabana";
  if(key==="sao goncalo"||key==="sg")return "São Gonçalo";
  if(key==="ilha plaza"||key==="ilha"||key==="ilha do governador"||key==="ilha plaza shopping")return "Ilha Plaza";
  if(key==="escritorio")return "Escritório";
  if(key==="administracao"||key==="administrativo")return "Administração";
  if(key==="extra")return "Extra";
  if(!key||key==="sem loja"||key==="nao informado")return "Sem loja";
  return String(value).trim().slice(0,44);
}
export function planShelves(devices, hiddenKeys) {
  const hidden = hiddenKeys instanceof Set ? hiddenKeys : new Set(hiddenKeys || []);
  const group = new Map(FIXED_STORES.map(name=>[name,{name,fixed:true,books:[]}]));
  for(const item of Array.isArray(devices)?devices:[]) {
    if(!item || typeof item!=="object" || typeof item.id!=="string" || item.id.length===0)continue;
    const name=canonicalStore(item.owner);
    if(!group.has(name))group.set(name,{name,fixed:false,books:[]});
    if(hidden.has("computer:"+item.id)||hidden.has("store:"+name))continue;
    group.get(name).books.push({
      id:item.id,name:String(item.name||"Computador").slice(0,45),
      owner:name,status:["online","offline","unknown"].includes(item.status)?item.status:"unknown",
      lastSeenAt:item.lastSeenAt||null
    });
  }
  const fixed=FIXED_STORES.map(name=>group.get(name));
  const additional=[...group.values()].filter(row=>!row.fixed && row.books.length>0)
    .sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
  for(const row of [...fixed,...additional]){
    row.books.sort((a,b)=>a.name.localeCompare(b.name,"pt-BR") || a.id.localeCompare(b.id));
  }
  return fixed.concat(additional);
}
export function bookLean(status,index,length){
  if(status!=="offline")return 0;
  return index < length-1 ? -0.33 : 0.33;
}
export function offsetForRow(offset,total,visible=VISIBLE_ROWS){
  return Math.min(Math.max(0,Math.trunc(Number(offset)||0)),Math.max(0,total-visible));
}
export function rowWindow(rows,offset,visible=VISIBLE_ROWS) {
  const top=offsetForRow(offset,rows.length,visible);
  return {offset:top,total:rows.length,
    first:rows.length?top+1:0,last:Math.min(rows.length,top+visible),
    rows:rows.slice(top,top+visible),
    canPrevious:top>0,canNext:top+visible<rows.length};
}
