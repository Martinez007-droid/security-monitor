const obtenerPuertos = require('./puertos');
const obtenerServicios = require('./servicios');
const analizarLogs = require('./logs');

// Puertos que consideramos "esperados" — cualquier otro puerto abierto genera alerta
const PUERTOS_ESPERADOS = ['22'];

function generarReporteCompleto() {
  const puertos = obtenerPuertos();
  const servicios = obtenerServicios();
  const logs = analizarLogs();

  const alertas = [];

  // 1. Alertas por puertos inesperados
  const puertosUnicos = [...new Set(puertos.map(p => p.puerto))];
  const puertosInesperados = puertosUnicos.filter(p => !PUERTOS_ESPERADOS.includes(p));
  // Nota: en un sistema real esto generaría muchas alertas por puertos internos altos (como los de VS Code Server).
  // Lo dejamos así a propósito para que veas cómo se comporta con datos reales, y lo ajustamos después si quieres ser más estricto.
  if (puertosInesperados.length > 0) {
    alertas.push({
      tipo: 'PUERTOS',
      severidad: 'info',
      mensaje: `Puertos abiertos fuera de la lista esperada: ${puertosInesperados.join(', ')}`,
    });
  }

  // 2. Alertas por servicios caídos
  const serviciosCaidos = servicios.filter(s => s.estado !== 'active');
  if (serviciosCaidos.length > 0) {
    alertas.push({
      tipo: 'SERVICIOS',
      severidad: 'alta',
      mensaje: `Servicios inactivos: ${serviciosCaidos.map(s => s.servicio).join(', ')}`,
    });
  }

  // 3. Alertas por intentos sospechosos de login
  const ipsSospechosas = logs.filter(l => l.sospechoso);
  for (const ip of ipsSospechosas) {
    alertas.push({
      tipo: 'AUTENTICACION',
      severidad: 'critica',
      mensaje: `Posible fuerza bruta desde ${ip.ip} (${ip.fallidos} intentos fallidos, usuarios: ${ip.usuariosProbados.join(', ')})`,
    });
  }

  return {
    fecha: new Date().toISOString(),
    puertos,
    servicios,
    logs,
    alertas,
    estadoGeneral: alertas.some(a => a.severidad === 'critica') ? 'CRITICO'
      : alertas.some(a => a.severidad === 'alta') ? 'ADVERTENCIA'
      : 'OK',
  };
}

module.exports = generarReporteCompleto;