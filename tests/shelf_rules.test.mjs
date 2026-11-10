import assert from "node:assert/strict";
import {FIXED_STORES,planShelves,bookLean,rowWindow,offsetForRow,VISIBLE_ROWS} from "../web/assets/shelf_rules.mjs";

assert.deepEqual(FIXED_STORES,["Centro","Icaraí","Itaipu","Copacabana","São Gonçalo","Ilha Plaza"]);
assert.equal(VISIBLE_ROWS,3);

const rows=planShelves([],new Set());
assert.equal(rows.length,6);
assert.deepEqual(rows.map(r=>r.name),FIXED_STORES);
assert.ok(rows.every(r=>r.fixed&&r.books.length===0));

const devices=[
  {id:"1",name:"Caixa 1",owner:"Centro",status:"online"},
  {id:"2",name:"Caixa 2",owner:"Centro",status:"offline"},
  {id:"3",name:"Extra 1",owner:"Extra",status:"offline"},
  {id:"4",name:"Extra 2",owner:"Extra",status:"online"},
  {id:"5",name:"Notebook",owner:"Escritório",status:"online"},
  {id:"6",name:"Caixa Ilha",owner:"Ilha",status:"unknown"},
  {id:"7",name:"SG",owner:"Sao Goncalo",status:"offline"}
];
let result=planShelves(devices,new Set());
assert.equal(result.length,8);
assert.deepEqual(result.slice(6).map(row=>row.name),["Escritório","Extra"]);
assert.equal(result.find(r=>r.name==="São Gonçalo").books.length,1);
assert.equal(result.find(r=>r.name==="Ilha Plaza").books[0].id,"6");

result=planShelves(devices,new Set(["computer:3","computer:4","computer:1","computer:2","computer:5"]));
assert.equal(result.length,6,"Loja opcional deve desaparecer e ceder espaço");
assert.equal(result.find(r=>r.name==="Centro").books.length,0,"Loja fixa fica vazia");
assert.equal(result.find(r=>r.name==="Ilha Plaza").books.length,1);
assert.equal(planShelves(devices,new Set(["store:Extra"])).length,7);

assert.equal(bookLean("online",0,2),0);
assert.equal(bookLean("unknown",0,2),0);
assert.ok(bookLean("offline",0,3)<0,"Livro com vizinho à direita inclina para a direita");
assert.ok(bookLean("offline",2,3)>0,"Último livro inclina para a esquerda");
assert.ok(bookLean("offline",0,1)>0,"Livro isolado inclina para a esquerda");

const many=FIXED_STORES.map((name,i)=>({id:"f"+i,name:"Fixo",owner:name,status:"online"}));
for(let i=0;i<15;i++)many.push({id:"x"+i,name:"Extra "+i,owner:"Setor "+i,status:"online"});
const all=planShelves(many,new Set());
assert.equal(all.length,21);
assert.equal(rowWindow(all,0).rows.length,3);
assert.equal(rowWindow(all,18).first,19);
assert.equal(rowWindow(all,18).last,21);
assert.equal(offsetForRow(99,all.length),18);
assert.equal(rowWindow(all,18).canNext,false);
assert.equal(rowWindow(all,18).canPrevious,true);
assert.equal(rowWindow(all,8).first,9);
assert.equal(rowWindow(all,8).last,11);
console.log("SHELF_RULES_OK: 6 lojas permanentes, setores dinâmicos, inclinação e rolagem");
