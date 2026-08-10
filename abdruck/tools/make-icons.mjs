/* Erzeugt die App-Icons — derselbe Rillen-Gedanke wie im Shader, nur auf der CPU.
   Aufruf:  node abdruck/tools/make-icons.mjs
   Ausgabe: abdruck/icons/*.png   (kein Fremdpaket, PNG wird von Hand geschrieben) */

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "icons");
mkdirSync(OUT, { recursive: true });

/* ---------- PNG schreiben ---------- */
const CRC = (() => {
  const t = new Int32Array(256);
  for(let n=0;n<256;n++){
    let c = n;
    for(let k=0;k<8;k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf){
  let c = -1;
  for(let i=0;i<buf.length;i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data){
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(width, height, rgba){
  const raw = Buffer.alloc((width*4 + 1) * height);
  for(let y=0;y<height;y++){
    raw[y*(width*4+1)] = 0;                                  // Filter: none
    rgba.copy(raw, y*(width*4+1)+1, y*width*4, (y+1)*width*4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

/* ---------- Rauschen ---------- */
function hash(x, y){
  const s = Math.sin(x*127.1 + y*311.7) * 43758.5453;
  return s - Math.floor(s);
}
const fade = t => t*t*(3-2*t);
function vnoise(x, y){
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = fade(x-ix), fy = fade(y-iy);
  const a = hash(ix,iy), b = hash(ix+1,iy), c = hash(ix,iy+1), d = hash(ix+1,iy+1);
  return (a + (b-a)*fx) + ((c + (d-c)*fx) - (a + (b-a)*fx))*fy;
}
function fbm(x, y){
  let s = 0, a = 0.5, f = 1;
  for(let i=0;i<4;i++){ s += a*(vnoise(x*f, y*f)*2-1); f *= 2.03; a *= 0.5; }
  return s;
}

/* ---------- Palette "Nebel" ---------- */
const STOPS = ["#4646ff","#7f4dff","#b263fc","#e92bff","#ff2f92","#ff6b8b","#5db4ff"]
  .map(h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]);
function palette(t){
  t = t - Math.floor(t);
  const n = STOPS.length, x = t*n, i = Math.floor(x)%n, f = fade(x-Math.floor(x));
  const a = STOPS[i], b = STOPS[(i+1)%n];
  return [a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f, a[2]+(b[2]-a[2])*f];
}

/* ---------- ein Icon ---------- */
function render(size, inset){
  const SS = 3;                       // 3×3 Überabtastung
  const buf = Buffer.alloc(size*size*4);
  const scale = 1/inset;              // < 1 schrumpft das Motiv (maskable)

  for(let py=0; py<size; py++){
    for(let px=0; px<size; px++){
      let R=0, G=0, B=0;
      for(let sy=0; sy<SS; sy++){
        for(let sx=0; sx<SS; sx++){
          const u = ((px + (sx+0.5)/SS)/size - 0.5) * 2 * scale;
          const v = ((py + (sy+0.5)/SS)/size - 0.5) * 2 * scale;

          const w  = fbm(u*1.7+3.1, v*1.7-2.2) * 0.26;
          const uu = u + w*0.45, vv = (v - 0.06) - w*0.34;
          const r  = Math.hypot(uu*1.06, vv*0.86);
          const th = Math.atan2(vv, uu);

          /* Schleife statt Kreis: der Kern sitzt tief, die Rillen laufen oben zusammen */
          const phase = r*23.0
                      + 1.15*Math.sin(th + 1.9)
                      + 0.34*Math.sin(th*2.0 - 1.1)
                      + w*2.4;
          const tri   = Math.abs(phase - Math.floor(phase) - 0.5) * 2;
          let line    = 1 - Math.min(tri/0.30, 1);
          line = line*line*(3-2*line);

          // Rillen brechen ab wie bei einem echten Abdruck
          line *= Math.min(Math.max((fbm(uu*5.5+11, vv*5.5-7) + 0.70)/0.42, 0), 1);
          // weicher Rand
          line *= 1 - Math.min(Math.max((r - 0.72)/0.20, 0), 1);

          // th nur über sin/cos einspeisen — sonst reißt die Palette am Winkelsprung auf
          const c = palette(0.02 + r*0.92 + 0.06*Math.sin(th + 0.8));
          const halo = Math.exp(-r*r*2.4) * 0.22;
          const bloom = line*line*line;

          R += 6  + c[0]*line*1.25 + c[0]*bloom*0.55 + c[0]*halo*0.45;
          G += 6  + c[1]*line*1.25 + c[1]*bloom*0.55 + c[1]*halo*0.45;
          B += 11 + c[2]*line*1.25 + c[2]*bloom*0.55 + c[2]*halo*0.55;
        }
      }
      const n = SS*SS, o = (py*size+px)*4;
      buf[o  ] = Math.min(255, Math.round(R/n));
      buf[o+1] = Math.min(255, Math.round(G/n));
      buf[o+2] = Math.min(255, Math.round(B/n));
      buf[o+3] = 255;
    }
  }
  return png(size, size, buf);
}

const jobs = [
  ["apple-touch-icon.png", 180, 1.0],
  ["icon-192.png",         192, 1.0],
  ["icon-512.png",         512, 1.0],
  ["maskable-512.png",     512, 0.68]   // Motiv kleiner: Platz für die Maske
];
for(const [name, size, inset] of jobs){
  writeFileSync(join(OUT, name), render(size, inset));
  console.log("→", name, size + "×" + size);
}
