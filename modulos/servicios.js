const { execSync } = require('child_process');

// Servicios que nos interesa monitorear específicamente
// (puedes ajustar esta lista según lo que te importe vigilar)
const SERVICIOS_A_REVISAR = ['ssh', 'cron', 'networking'];

function obtenerEstadoServicio(nombreServicio) {
  try {
    // is-active devuelve "active" o "inactive", y execSync no lanza error en ninguno de los dos casos normalmente
    const estado = execSync(`systemctl is-active ${nombreServicio}`, { encoding: 'utf-8' }).trim();
    return estado;
  } catch (error) {
    // Si el servicio no existe o está fallido, systemctl puede devolver código de error distinto de 0,
    // lo cual hace que execSync lance una excepción. Igual queremos capturar el estado real.
    return error.stdout ? error.stdout.trim() : 'desconocido';
  }
}

function obtenerEstadoServicios() {
  return SERVICIOS_A_REVISAR.map(nombre => ({
    servicio: nombre,
    estado: obtenerEstadoServicio(nombre),
  }));
}

module.exports = obtenerEstadoServicios;