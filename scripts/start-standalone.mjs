import nextEnv from '@next/env';
import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Match Next.js' normal .env loading before starting its documented standalone
// server entry point.
nextEnv.loadEnvConfig(process.cwd());

const serverPath = resolve(process.cwd(), '.next/standalone/server.js');
const standalonePath = resolve(process.cwd(), '.next/standalone');
await mkdir(resolve(standalonePath, '.next'), { recursive: true });
await cp(resolve(process.cwd(), '.next/static'), resolve(standalonePath, '.next/static'), { recursive: true });
await cp(resolve(process.cwd(), 'public'), resolve(standalonePath, 'public'), { recursive: true });
await import(pathToFileURL(serverPath).href);
