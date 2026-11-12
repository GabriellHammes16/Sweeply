import { mkdir, writeFile } from 'node:fs/promises';

const symbol = (color) => `<g fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"><path d="M28 8H16a9 9 0 0 0 0 18h4"/><path d="M8 28h12a9 9 0 0 0 0-18h-4" opacity=".5"/></g>`;
const svg = (w,h,body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
await mkdir('branding/logos', { recursive: true });
await mkdir('branding/icons', { recursive: true });
await mkdir('public', { recursive: true });
for (const [variant, color, text] of [['dark','#70bca3','#f5f5f5'],['light','#27775e','#242b32'],['mono-dark','#f5f5f5','#f5f5f5'],['mono-light','#242b32','#242b32']]) {
  await writeFile(`branding/logos/symbol-${variant}.svg`, svg(36,36,symbol(color)));
  await writeFile(`branding/logos/horizontal-${variant}.svg`, svg(220,48,`<g transform="translate(4 6)">${symbol(color)}</g><text x="50" y="34" font-family="Inter,Segoe UI,sans-serif" font-size="30" font-weight="600" letter-spacing="-1" fill="${text}">Sweeply.</text>`));
  await writeFile(`branding/logos/vertical-${variant}.svg`, svg(200,144,`<g transform="translate(64 8) scale(2)">${symbol(color)}</g><text x="100" y="125" text-anchor="middle" font-family="Inter,Segoe UI,sans-serif" font-size="30" font-weight="600" letter-spacing="-1" fill="${text}">Sweeply.</text>`));
}
await writeFile('public/symbol.svg',svg(36,36,symbol('#70bca3')));
await writeFile('branding/icons/app.svg',svg(512,512,`<rect x="8" y="8" width="496" height="496" rx="112" fill="#202226"/><g transform="translate(76 76) scale(10)">${symbol('#70bca3')}</g>`));
console.log('SVGs de marca e ícone gerados.');
