import { cpSync, copyFileSync, mkdirSync, rmSync } from 'node:fs';
const root = new URL('../', import.meta.url);
rmSync(new URL('dist/forpsi/', root), { recursive: true, force: true });
mkdirSync(new URL('dist/forpsi/', root), { recursive: true });
cpSync(new URL('dist/client/', root), new URL('dist/forpsi/', root), { recursive: true });
for (const file of ['contact.php', '.htaccess']) {
  copyFileSync(new URL('hosting/forpsi/' + file, root), new URL('dist/forpsi/' + file, root));
}
console.log('FORPSI upload folder: dist/forpsi (including .htaccess)');
