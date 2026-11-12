import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url)),
);
const config = JSON.parse(
  readFileSync(new URL("../src-tauri/tauri.conf.json", import.meta.url)),
);
const cargo = readFileSync(
  new URL("../src-tauri/Cargo.toml", import.meta.url),
  "utf8",
);
assert.equal(
  config.version,
  pkg.version,
  "Versões package.json/tauri.conf.json diferentes",
);
assert.equal(
  cargo.match(/^version\s*=\s*"([^"]+)"/m)?.[1],
  pkg.version,
  "Versão Cargo.toml diferente",
);
assert.equal(config.bundle.createUpdaterArtifacts, true);
assert.equal(config.plugins.updater.requireSignedVersion, true);
assert.ok(config.plugins.updater.pubkey.length > 40, "Chave pública ausente");
assert.deepEqual(config.plugins.updater.endpoints, [
  "https://github.com/GabriellHammes16/Sweeply/releases/latest/download/latest.json",
]);
const tag =
  process.argv[2] ||
  (process.env.GITHUB_REF_TYPE === "tag"
    ? process.env.GITHUB_REF_NAME
    : undefined);
if (tag) assert.equal(tag, `v${pkg.version}`, "Tag diferente da versão do app");
console.log(`Sweeply ${pkg.version}: configuração de release consistente.`);
