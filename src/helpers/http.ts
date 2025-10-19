// src/helpers/http.ts
import fetch from 'node-fetch';

export const isAllowedHost = (urlStr:string)=>{
  try{
    const list=(process.env.ALLOWED_IMG_HOSTS||'').split(',').map(s=>s.trim()).filter(Boolean);
    const u=new URL(urlStr);
    return list.length===0 || list.some(h=>u.hostname===h || u.hostname.endsWith(`.${h}`));
  }catch{return false;}
};

export async function fetchImage(url:string, timeoutMs=5000){
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(), timeoutMs);
  const res = await fetch(url, { signal: ctrl.signal });
  clearTimeout(t);
  if (!res.ok) throw new Error(`fetch_${res.status}`);
  const ab = await res.arrayBuffer();
  const buf = Buffer.from(ab);
  if (buf.length > 15*1024*1024) throw new Error('too_big');
  const lastMod = res.headers.get('last-modified') || new Date().toUTCString();
  return { buf, lastMod };
}
