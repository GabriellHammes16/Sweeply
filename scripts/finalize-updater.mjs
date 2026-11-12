import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";

const [manifestPath, releasePath] = process.argv.slice(2);
assert.ok(
  manifestPath && releasePath,
  "Informe o manifesto e os metadados da release.",
);
const manifest = JSON.parse(
  readFileSync(manifestPath, "utf8").replace(/^\uFEFF/, ""),
);
const release = JSON.parse(
  readFileSync(releasePath, "utf8").replace(/^\uFEFF/, ""),
);
assert.equal(
  release.tagName,
  `v${manifest.version}`,
  "Versão e tag diferentes.",
);
assert.ok(
  Object.keys(manifest.platforms).length > 0,
  "Manifesto sem plataformas.",
);
for (const platform of Object.values(manifest.platforms)) {
  const asset = release.assets.find(
    (asset) => asset.apiUrl === platform.url || asset.url === platform.url,
  );
  assert.ok(
    asset?.name.endsWith("-setup.exe"),
    "Download não corresponde ao instalador da release.",
  );
  assert.ok(platform.signature?.length > 0, "Instalador sem assinatura.");
  platform.url = `https://github.com/GabriellHammes16/Sweeply/releases/download/${encodeURIComponent(release.tagName)}/${encodeURIComponent(asset.name)}`;
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Manifesto ${manifest.version}: downloads oficiais normalizados.`);
