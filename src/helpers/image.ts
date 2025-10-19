// src/helpers/image.ts
import sharp from 'sharp';
import crypto from 'crypto';

export const clamp = (n:any,min:number,max:number,dflt:number)=>{
  const x = Number(n ?? dflt);
  return Number.isNaN(x) ? dflt : Math.max(min, Math.min(max, x));
};
export const pickFormat = (accept?:string, forced?:string)=>{
  const f=(forced||'auto').toLowerCase();
  if (f!=='auto') return f;
  if ((accept||'').includes('image/avif')) return 'avif';
  if ((accept||'').includes('image/webp')) return 'webp';
  return 'jpeg';
};
export const hexColor = (s?:string)=>{
  const v=(s||'ffffff').replace('#','').toLowerCase();
  return /^[0-9a-f]{6}$/.test(v)?`#${v}`:'#ffffff';
};
export const gravityFromAlign = (a?:string)=>{
  const x=(a||'center').toLowerCase();
  return x==='top'?sharp.gravity.north:
         x==='bottom'?sharp.gravity.south:
         x==='left'?sharp.gravity.west:
         x==='right'?sharp.gravity.east:sharp.gravity.center;
};
export const etag = (buf:Buffer)=>`"${crypto.createHash('md5').update(buf).digest('hex')}"`;
