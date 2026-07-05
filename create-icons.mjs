import fs from "fs";

// Minimal valid 1x1 PNG generator - we'll create proper colored PNGs
// Using a base64-encoded blue shield PNG for each size

// These are hand-crafted minimal PNGs with blue background + white shield
// Generated as data URIs and decoded to binary

function hexToBytes(hex) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return Buffer.from(bytes);
}

// We'll write the SVG files and reference them via a data URI approach
// Chrome can actually load SVG as icons via a workaround in manifest v3
// But the most reliable way is PNG. Let's create them via Canvas API simulation.

// Since we can't use canvas in Node without extra deps, let's write minimal valid PNGs
// A minimal blue 16x16 PNG (pre-computed)
const sizes = [16, 48, 128];

for (const size of sizes) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="#1d4ed8"/>
  <path d="M${size/2} ${size*0.12}L${size*0.18} ${size*0.28}v${size*0.28}c0 ${size*0.24} ${size*0.16} ${size*0.39} ${size*0.32} ${size*0.46} ${size*0.16}-${size*0.07} ${size*0.32}-${size*0.22} ${size*0.32}-${size*0.46}V${size*0.28}L${size/2} ${size*0.12}z" fill="rgba(255,255,255,0.25)" stroke="white" stroke-width="${size*0.05}"/>
  <path d="M${size*0.34} ${size*0.54}l${size*0.12} ${size*0.12}L${size*0.64} ${size*0.38}" stroke="white" stroke-width="${size*0.09}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
  fs.writeFileSync(`extension/icon${size}.svg`, svg);
}

console.log("SVG icons written for sizes: 16, 48, 128");
console.log("NOTE: Chrome needs PNG - convert these SVGs to PNG manually or use the inline approach.");
