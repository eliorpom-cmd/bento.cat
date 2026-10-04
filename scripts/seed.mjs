// Uploads the demo cat photos to Convex file storage and creates the demo boxes.
// Run with `bun run seed` while `bun run convex` is running. Safe to run again.
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ASSET_FILES } from '../convex/demo.js';

const DIR = path.resolve('design/cats');
const convex = (fn, args = {}) =>
  JSON.parse(execFileSync('bunx', ['convex', 'run', fn, JSON.stringify(args)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim());

const assets = [];
for (const [key, file] of Object.entries(ASSET_FILES)) {
  const p = path.join(DIR, file);
  if (!existsSync(p)) {
    console.warn(`skip ${key}: ${p} not found`);
    continue;
  }
  const url = convex('seed:uploadUrl');
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: await readFile(p) });
  if (!res.ok) throw new Error(`upload of ${file} failed: ${res.status}`);
  const { storageId } = await res.json();
  assets.push({ key, storageId });
  console.log(`uploaded ${key}`);
}

const result = convex('seed:run', { assets });
console.log(`done: ${result.assets} images, ${result.created} new demo boxes`);
