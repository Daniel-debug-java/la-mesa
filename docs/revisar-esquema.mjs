/**
 * Repaso de coherencia: comprueba que todo lo que la app, el panel y las
 * funciones le piden a la base exista realmente en el esquema.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Se ejecuta desde donde sea: siempre revisa la raíz del repositorio
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(RAIZ);

const schema = fs.readFileSync('supabase/schema.sql','utf8');

// Tablas y columnas declaradas
const tablas = {};
for (const m of schema.matchAll(/create table (\w+)\s*\(([\s\S]*?)\n\);/g)) {
  const cols = new Set();
  for (const linea of m[2].split('\n')) {
    const c = linea.trim().match(/^([a-z_][a-z0-9_]*)\s+/);
    if (c && !['primary','foreign','constraint','unique','check'].includes(c[1])) cols.add(c[1]);
  }
  tablas[m[1]] = cols;
}
// Tipos enum
const enums = {};
for (const m of schema.matchAll(/create type (\w+)\s+as enum \(([^)]+)\)/g)) {
  enums[m[1]] = m[2].split(',').map(s=>s.trim().replace(/'/g,''));
}

const archivos = [];
(function walk(d){
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d,f);
    if (f==='node_modules'||f==='.git'||f==='.expo') continue;
    if (p === 'docs/revisar-esquema.mjs') continue;  // no se revisa a sí mismo
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx|html|mjs)$/.test(f)) archivos.push(p);
  }
})('.');

let problemas = [];

// 1 · .from('tabla') existe
for (const a of archivos) {
  const txt = fs.readFileSync(a,'utf8');
  for (const m of txt.matchAll(/\.from\(['"`](\w+)['"`]\)/g)) {
    if (!tablas[m[1]]) problemas.push(`${a}: tabla desconocida "${m[1]}"`);
  }
  // 2 · rutas REST del panel: /rest/v1/tabla
  for (const m of txt.matchAll(/\/rest\/v1\/(\w+)\?/g)) {
    if (!tablas[m[1]]) problemas.push(`${a}: tabla desconocida en REST "${m[1]}"`);
  }
}

// 3 · columnas de los select() contra el esquema
for (const a of archivos) {
  const txt = fs.readFileSync(a,'utf8');
  const bloques = [...txt.matchAll(/\.from\(['"`](\w+)['"`]\)\s*\n?\s*\.select\(\s*([\s\S]{0,600}?)\)/g)];
  for (const b of bloques) {
    const tabla = b[1];
    const cols = (b[2].match(/['"`]([^'"`]+)['"`]/g)||[]).join(',').replace(/['"`]/g,'');
    if (cols.includes('*')) continue;
    // quita relaciones anidadas tipo tabla(col,col)
    const plano = cols.replace(/\w+\([^)]*\)/g,'');
    for (const c of plano.split(',').map(s=>s.trim()).filter(Boolean)) {
      if (!/^[a-z_][a-z0-9_]*$/.test(c)) continue;
      if (!tablas[tabla]?.has(c)) problemas.push(`${a}: ${tabla}.${c} no existe`);
    }
  }
}

// 4 · columnas de insert/update por objeto literal
for (const a of archivos) {
  const txt = fs.readFileSync(a,'utf8');
  for (const m of txt.matchAll(/\.from\(['"`](\w+)['"`]\)\s*\n?\s*\.(insert|update|upsert)\(\{([\s\S]{0,900}?)\}\)/g)) {
    const tabla = m[1];
    for (const c of m[3].matchAll(/^\s*([a-z_][a-z0-9_]*)\s*:/gm)) {
      if (!tablas[tabla]?.has(c[1])) problemas.push(`${a}: ${tabla}.${c[1]} no existe (${m[2]})`);
    }
  }
}

// 5 · estados de pedido usados en el código contra el enum
const estados = new Set(enums['estado_pedido']||[]);
const RESULTADO_PAGO = new Set(['aprobado','rechazado','pendiente','cancelado','error']);
for (const a of archivos.filter(f=>/app-movil|panel|functions/.test(f))) {
  const txt = fs.readFileSync(a,'utf8');
  for (const m of txt.matchAll(/estado:\s*['"](\w+)['"]|estado ===?\s*['"](\w+)['"]/g)) {
    const v = m[1]||m[2];
    if (v && !estados.has(v) && !RESULTADO_PAGO.has(v) && !['abierta','cerrada'].includes(v))
      problemas.push(`${a}: estado de pedido desconocido "${v}"`);
  }
}

// 6 · métodos de pago
// Checkout y la pantalla de Perfil > Métodos de pago comparten esta misma
// lista (src/datos/metodosPago.ts) para no desalinearse entre ellas.
const metodos = new Set(enums['metodo_pago']||[]);
const pagosApp = [...fs.readFileSync('app-movil/src/datos/metodosPago.ts','utf8')
  .matchAll(/id:\s*'(\w+)'\s*,\s*nombre:/g)].map(m=>m[1]);
for (const p of pagosApp) if (!metodos.has(p)) problemas.push(`metodosPago.ts: método de pago "${p}" no está en el enum`);

console.log(`Tablas en el esquema: ${Object.keys(tablas).length}`);
console.log(`Archivos revisados: ${archivos.length}`);
console.log(`Estados de pedido: ${[...estados].join(', ')}`);
console.log(`Métodos de pago en la app: ${pagosApp.join(', ')}`);
console.log('');
if (problemas.length) { console.log('PROBLEMAS:'); problemas.forEach(p=>console.log(' · '+p)); }
else console.log('Sin desajustes entre el código y el esquema.');
process.exit(problemas.length ? 1 : 0);
