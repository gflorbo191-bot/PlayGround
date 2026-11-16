// static server tanpa cache
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'
const root = process.cwd()
const types = { '.html':'text/html', '.js':'text/javascript', '.png':'image/png', '.jpg':'image/jpeg', '.css':'text/css' }
createServer((req,res)=>{
  let p = req.url.split('?')[0]
  if (p === '/') p = '/index.html'
  const f = join(root, p)
  if (!existsSync(f)) { res.writeHead(404); res.end('nf'); return }
  res.writeHead(200, { 'content-type': types[extname(f)]||'application/octet-stream', 'cache-control':'no-store' })
  res.end(readFileSync(f))
}).listen(3002, ()=>console.log('serving :3002 no-store'))
