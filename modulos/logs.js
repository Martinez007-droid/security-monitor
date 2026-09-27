const { execSync } = require('child_process');

const UMBRAL_SOSPECHOSO = 5;

const REGEX_FALLIDO = /Failed password for (invalid user )?(\S+) from (\S+) port (\d+)/;
const REGEX_EXITOSO = /Accepted password for (\S+) from (\S+) port (\d+)/;

function analizarLinea(linea) {
  const matchFallido = linea.match(REGEX_FALLIDO);
  if (matchFallido) {
    return { resultado: 'FAILED', usuario: matchFallido[2], ip: matchFallido[3] };
  }

  const matchExitoso = linea.match(REGEX_EXITOSO);
  if (matchExitoso) {
    return { resultado: 'SUCCESS', usuario: matchExitoso[1], ip: matchExitoso[2] };
  }

  return null;
}

function obtenerLineasDeLog() {
  try {
    // Leemos directo del journal del sistema, en vez de un archivo estático
    const salida = execSync('journalctl -u ssh --no-pager -n 200', { encoding: 'utf-8' });
    return salida.split('\n').filter(l => l.trim() !== '');
  } catch (error) {
    console.error('Error leyendo el journal de SSH:', error.message);
    return [];
  }
}

function analizarIntentosDeLogin() {
  const lineas = obtenerLineasDeLog();
  const conteo = {};

  for (const linea of lineas) {
    const info = analizarLinea(linea);
    if (!info) continue;

    if (!conteo[info.ip]) {
      conteo[info.ip] = { fallidos: 0, exitosos: 0, usuarios: new Set() };
    }

    if (info.resultado === 'FAILED') {
      conteo[info.ip].fallidos += 1;
    } else {
      conteo[info.ip].exitosos += 1;
    }

    conteo[info.ip].usuarios.add(info.usuario);
  }

  return Object.entries(conteo).map(([ip, datos]) => ({
    ip,
    fallidos: datos.fallidos,
    exitosos: datos.exitosos,
    sospechoso: datos.fallidos > UMBRAL_SOSPECHOSO,
    usuariosProbados: [...datos.usuarios],
  }));
}

module.exports = analizarIntentosDeLogin;