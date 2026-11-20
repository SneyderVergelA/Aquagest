// Se ejecuta automaticamente despues de "npm install".
// Alinea las librerias con las versiones exactas que requiere el SDK de Expo.
// Solo corre una vez (crea el archivo .versiones-ok).
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const marca = path.join(__dirname, '..', '.versiones-ok');
if (fs.existsSync(marca)) process.exit(0);

console.log('\n[Aquagest] Alineando versiones con el SDK de Expo (solo la primera vez)...\n');
fs.writeFileSync(marca, 'ok');

const r = spawnSync('npx', ['expo', 'install', '--fix'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..')
});

if (r.status !== 0) {
  try { fs.unlinkSync(marca); } catch (e) {}
  console.log('\n[Aquagest] No se pudo alinear automaticamente. Ejecuta manualmente: npx expo install --fix\n');
}
process.exit(0);
