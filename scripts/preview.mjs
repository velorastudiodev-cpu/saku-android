// Test-only preview: fixture data is never included in the production bundle.
import fs from "node:fs";
import { fixture } from "../tests/fixture.ts";
const out = process.argv[2] || ".taste-skill/preview";
fs.mkdirSync(out, { recursive: true });
fs.cpSync("dist", out, { recursive: true });
const seed = `<script>localStorage.setItem("CapacitorStorage.saku.wallet.v1",${JSON.stringify(JSON.stringify(fixture()))});</script>`;
fs.writeFileSync(
  `${out}/index.html`,
  fs.readFileSync("dist/index.html", "utf8").replace("<head>", "<head>" + seed),
);
