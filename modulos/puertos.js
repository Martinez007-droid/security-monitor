const { execSync } = require('child_process');

function extraerNombreProceso(campoProceso) {
  if (!campoProceso || !campoProceso.startsWith('users:')) {
    return 'desconocido (requiere permisos)';
  }
  const match = campoProceso.match(/\(\("([^"]+)",pid=(\d+)/);
  if (match) {
    return `${match[1]} (PID ${match[2]})`;
  }
  return 'desconocido';
}

function obtenerPuertosEscuchando() {
  try {
    const salida = execSync('ss -tlnp', { encoding: 'utf-8' });
    const lineas = salida.split('\n').filter(l => l.trim() !== '' && !l.startsWith('State'));

    const puertos = lineas.map(linea => {
      const partes = linea.trim().split(/\s+/);
      const direccionLocal = partes[3] || '';
      const puerto = direccionLocal.split(':').pop();
      const campoProceso = partes[5];

      return {
        puerto,
        direccionLocal,
        proceso: extraerNombreProceso(campoProceso),
      };
    });

    return puertos;
  } catch (error) {
    console.error('Error obteniendo puertos:', error.message);
    return [];
  }
}

module.exports = obtenerPuertosEscuchando;