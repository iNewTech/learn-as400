import { cpSync, rmSync } from 'node:fs';
const source = new URL('../netlify-dist/', import.meta.url);
const target = new URL('../out/', import.meta.url);
rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
