const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),port=Number(process.env.FQ_PORT||8780);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png','.md':'text/plain; charset=utf-8','.json':'application/json'};
http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  let rel;try{rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '')||'index.html';}catch{res.writeHead(400);res.end();return;}
  const target=path.resolve(root,rel);
  if(!target.startsWith(root+path.sep)||rel.split(/[\\/]/).some(part=>part.startsWith('.'))){res.writeHead(403);res.end();return;}
  fs.readFile(target,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(target)]||'text/plain','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:data);});
}).listen(port,'127.0.0.1',()=>console.log(`福祉クエスト 3D: http://127.0.0.1:${port}/`));
