import { promises as fs } from 'fs';
import { join, dirname } from 'path';

const templates = import.meta.glob('../templates/**/*', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const PREFIX = '../templates/';

console.log('Loaded ESPHome templates:', Object.keys(templates));

export async function copyStaticTemplates(tempDir: string): Promise<void> {
  const writes = Object.entries(templates).map(async ([key, content]) => {
    const relativePath = key.startsWith(PREFIX) ? key.slice(PREFIX.length) : key;
    const destPath = join(tempDir, relativePath);
    await fs.mkdir(dirname(destPath), { recursive: true });

    const existingContent = await fs.readFile(destPath, 'utf-8').catch(() => null);
    if (existingContent === content) return;

    await fs.writeFile(destPath, content);
  });

  await Promise.all(writes);
}
