import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageDir = path.resolve(__dirname, '..');
const schemaPath = path.join(packageDir, 'schemas', 'watch-sync-message.schema.json');
const outputPath = path.join(packageDir, 'generated', 'swift', 'WatchContracts.swift');

await mkdir(path.dirname(outputPath), { recursive: true });

const args = [
  '--src-lang',
  'schema',
  '--lang',
  'swift',
  '--top-level',
  'WatchSyncMessage',
  '--access-level',
  'public',
  '--swift-5-support',
  '--acronym-style',
  'original',
  '--src',
  schemaPath,
  '--out',
  outputPath
];

await new Promise((resolve, reject) => {
  const child = spawn('quicktype', args, { stdio: 'inherit' });

  child.on('error', reject);
  child.on('exit', (code) => {
    if (code === 0) {
      resolve();
      return;
    }

    reject(new Error(`quicktype exited with code ${code ?? 'unknown'}`));
  });
});

console.log(`Generated Swift contracts: ${path.relative(packageDir, outputPath)}`);
