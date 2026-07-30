// Reimplementa firma.ts con la misma lógica y la ejerce contra los ejemplos
// documentados por Wompi, más casos límite del validador de eventos.
import { webcrypto as crypto } from 'node:crypto';

async function sha256(t){
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  return Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function firmaIntegridad(ref, cent, mon, sec, exp){
  const base = `${ref}${cent}${mon}${sec}`;
  return sha256(exp ? `${base}${exp}` : base);
}
function comparacionSegura(a,b){
  if(a.length!==b.length) return false;
  let d=0; for(let i=0;i<a.length;i++) d|=a.charCodeAt(i)^b.charCodeAt(i);
  return d===0;
}
async function eventoEsAutentico(ev, sec){
  if(!ev?.signature?.properties || !ev.signature.checksum) return false;
  const valores = ev.signature.properties.map(ruta =>
    String(ruta.split('.').reduce((n,k)=> (n && typeof n==='object') ? n[k] : undefined, ev.data) ?? ''));
  const calc = await sha256(valores.join('') + ev.timestamp + sec);
  return comparacionSegura(calc, ev.signature.checksum.toLowerCase());
}

let fallos = 0;
const ok = (n,c)=>{ console.log((c?'  ok  ':'FALLA') + '  ' + n); if(!c) fallos++; };

// 1 · Firma de integridad, ejemplo de la documentación
ok('firma de integridad = ejemplo documentado',
  await firmaIntegridad('sk8-438k4-xmxm392-sn2m',2490000,'COP',
    'prod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6')
  === '37c8407747e595535433ef8f6a811d853cd943046624a0ec04662b17bbf33bf5');

// 2 · Con expiración cambia la firma
const sinExp = await firmaIntegridad('ref',1000,'COP','sec');
const conExp = await firmaIntegridad('ref',1000,'COP','sec','2026-08-01T00:00:00.000Z');
ok('la expiración altera la firma', sinExp !== conExp);

// 3 · Un centavo distinto cambia la firma (no se puede rebajar el monto)
ok('un centavo cambia la firma',
  (await firmaIntegridad('ref',1000,'COP','sec')) !== (await firmaIntegridad('ref',999,'COP','sec')));

// 4 · Evento bien firmado
const ts = 1530291411, sec = 'prod_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z';
const tx = { id:'1234-1610641025-49201', status:'APPROVED', amount_in_cents:4490000 };
const props = ['transaction.id','transaction.status','transaction.amount_in_cents'];
const checksum = await sha256('1234-1610641025-49201APPROVED4490000' + ts + sec);
const evento = { event:'transaction.updated', data:{transaction:tx}, timestamp:ts,
                 signature:{ properties:props, checksum } };
ok('evento auténtico se acepta', await eventoEsAutentico(evento, sec));

// 5 · Concatenación igual a la del ejemplo de la doc
ok('concatenación = "…APPROVED4490000" + timestamp + secreto',
  checksum === await sha256(['1234-1610641025-49201','APPROVED','4490000'].join('') + ts + sec));

// 6 · Checksum manipulado se rechaza
ok('checksum alterado se rechaza',
  !(await eventoEsAutentico({...evento, signature:{properties:props, checksum:'0'.repeat(64)}}, sec)));

// 7 · Monto alterado se rechaza (aunque el checksum sea el original)
ok('monto alterado se rechaza',
  !(await eventoEsAutentico({...evento, data:{transaction:{...tx, amount_in_cents:1}}}, sec)));

// 8 · Secreto equivocado se rechaza
ok('secreto equivocado se rechaza', !(await eventoEsAutentico(evento, 'otro_secreto')));

// 9 · Evento sin firma se rechaza
ok('evento sin firma se rechaza', !(await eventoEsAutentico({data:{}, timestamp:ts}, sec)));

// 10 · Checksum en mayúsculas se acepta
ok('checksum en mayúsculas se acepta',
  await eventoEsAutentico({...evento, signature:{properties:props, checksum:checksum.toUpperCase()}}, sec));

// 11 · Propiedad inexistente no revienta
ok('propiedad inexistente no revienta',
  !(await eventoEsAutentico({...evento, signature:{properties:['transaction.no_existe'], checksum}}, sec)));

console.log(fallos ? `\n${fallos} prueba(s) fallaron` : '\nTodas las pruebas pasaron');
process.exit(fallos ? 1 : 0);
