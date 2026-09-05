const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const code=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8'),scope='https://example.test/fukushi-quest/';
function worker(){
  const handlers={},items=new Map(),deleted=[],requested=[];let online=true;
  const cache={addAll:async reqs=>{for(const r of reqs){requested.push(r.url);items.set(r.url,new Response('cached:'+new URL(r.url).pathname));}},match:async url=>items.get(url)?.clone()};
  const revision=code.match(/const CACHE = PREFIX \+ '([^']+)'/)[1];
  const caches={open:async()=>cache,keys:async()=>['unrelated-app','fukushi-quest-v13','fq3d:'+scope+':old','fq3d:'+scope+':'+revision],delete:async key=>deleted.push(key)};
  vm.runInNewContext(code,{URL,Request,Response,Set,Promise,self:{registration:{scope},location:{origin:'https://example.test'},clients:{claim:async()=>{}},skipWaiting:async()=>{},addEventListener:(t,f)=>handlers[t]=f},caches,fetch:async req=>{if(!online)throw Error('offline');return new Response('network');}});
  return {items,deleted,requested,setOffline:()=>online=false,async event(name){let pending;handlers[name]({waitUntil:p=>pending=p});await pending;},async get(url){let pending;handlers.fetch({request:new Request(url),respondWith:p=>pending=p});return pending?await pending:null;}};
}
test('precache contains real local files including both Three.js modules',async()=>{
  const w=worker();await w.event('install');assert.equal(w.requested.length,16);
  for(const url of w.requested)assert.ok(fs.existsSync(path.join(__dirname,'..',url.slice(scope.length))),url);
  assert.ok(w.requested.includes(scope+'vendor/three.core.min.js'));
});
test('activate deletes only older caches for this exact application scope',async()=>{
  const w=worker();await w.event('activate');assert.deepEqual(w.deleted,['fq3d:'+scope+':old']);
});
test('offline navigation and modules return the matching asset, never HTML for JS',async()=>{
  const w=worker();await w.event('install');w.setOffline();
  assert.equal(await (await w.get(scope+'?from=home')).text(),'cached:/fukushi-quest/index.html');
  assert.equal(await (await w.get(scope+'world.js')).text(),'cached:/fukushi-quest/world.js');
  w.items.delete(scope+'world.js');assert.equal((await w.get(scope+'world.js')).status,503);
  assert.equal(await w.get(scope+'missing.js'),null);assert.equal(await w.get('https://example.test/other/'),null);assert.equal(await w.get('https://external.test/'),null);
});
