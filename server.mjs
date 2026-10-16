import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';

const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.WEIZTECH_PORT||5176);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
const allowedFiles=new Set(['index.html','styles.css','script.js','scene.js','models.js','illustrations.js','motion.js','config.js','legal.js','impressum.html','datenschutz.html','robots.txt','sitemap.xml']);
const server=http.createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});return res.end();}
  try{
    const url=new URL(req.url,'http://127.0.0.1');
    const relative=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';
    const file=path.resolve(root,relative);
    if(!file.startsWith(root+path.sep)||(!relative.startsWith('assets/')&&!allowedFiles.has(relative))){res.writeHead(404);return res.end('Not found');}
    const extension=path.extname(file);
    const body=await readFile(file);
    const compress=/\bgzip\b/.test(req.headers['accept-encoding']||'')&&['.html','.js','.css','.xml'].includes(extension);
    const headers={'Content-Type':types[extension]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache','Vary':'Accept-Encoding'};
    if(compress)headers['Content-Encoding']='gzip';
    res.writeHead(200,headers);res.end(req.method==='HEAD'?undefined:compress?gzipSync(body):body);
  }catch{res.writeHead(404);res.end('Not found');}
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} is already in use. Open http://127.0.0.1:${port} or set WEIZTECH_PORT to another port.`:error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`WeizTech 7 is ready: http://127.0.0.1:${port}\nKeep this window open. Press Ctrl+C to stop.`));
