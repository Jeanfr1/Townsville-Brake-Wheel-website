import { cp, mkdir } from 'node:fs/promises';

// Only visitor-facing files belong in the deployable output.
const root = new URL('../', import.meta.url);
await mkdir(new URL('dist/', root), { recursive: true });
for (const name of ['index.html', 'styles.css', 'app.js', 'assets']) {
  await cp(new URL(`site/${name}`, root), new URL(`dist/${name}`, root), { recursive: true });
}
console.log('Built dist/: HTML, CSS, JavaScript, local fonts, images and films.');
