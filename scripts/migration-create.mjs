import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const name = process.argv[2];
if (!name) {
  console.error('Usage: pnpm migration:create -- <MigrationName>');
  console.error('Example: pnpm migration:create -- ManualChange');
  process.exit(1);
}

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const migrationPath = join('src', 'database', 'migrations', name);

const cli = join(projectRoot, 'node_modules', 'typeorm', 'cli-ts-node-commonjs.js');
// migration:create only scaffolds a file; it does not connect to the DB, so no -d flag.
const result = spawnSync(
  process.execPath,
  [cli, 'migration:create', migrationPath],
  { stdio: 'inherit', cwd: projectRoot },
);

process.exit(result.status ?? 1);