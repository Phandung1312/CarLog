import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const assets = join(process.cwd(), "dist", "assets");
const files = readdirSync(assets).map((name) => ({ name, bytes: statSync(join(assets, name)).size }));
const limits = [
  { match: /^index-.*\.js$/, max: 125_000, label: "initial application JavaScript" },
  { match: /^three-engine-.*\.js$/, max: 1_400_000, label: "Three.js engine" },
  { match: /^VehicleScene-.*\.js$/, max: 40_000, label: "lazy VehicleScene chunk" },
];
for (const limit of limits) {
  const file = files.find((item) => limit.match.test(item.name));
  if (!file) throw new Error(`Missing ${limit.label} output`);
  if (file.bytes > limit.max) throw new Error(`${limit.label} is ${file.bytes} bytes; budget is ${limit.max}`);
}
console.log("Bundle budgets passed.");
