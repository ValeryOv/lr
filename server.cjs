const http=require('http'),fs=require('fs'),path=require('path');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'};
const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname;
  const file=path.resolve(__dirname,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(__dirname+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);return res.end('Не знайдено');}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);});
});
server.listen(4173,'127.0.0.1',()=>console.log('http://127.0.0.1:4173'));
