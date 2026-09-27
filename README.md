Security Monitor

Herramienta de monitoreo de seguridad para sistemas Linux, con backend en Node.js/Express y un dashboard web que se actualiza automáticamente. Combina tres fuentes de datos del sistema (puertos abiertos, servicios activos y logs de autenticación SSH) para generar alertas y un estado general de seguridad.

¿Qué hace?

Puertos: detecta qué puertos TCP están escuchando en el sistema y qué proceso los tiene abiertos
Servicios: revisa el estado (activo/inactivo) de servicios críticos del sistema (`ssh`, `cron`, `networking`)
Autenticación: analiza en tiempo real los logs de SSH (vía `journalctl`) para detectar intentos de fuerza bruta o ataques de diccionario
Alertas: combina las tres fuentes anteriores y genera alertas categorizadas por severidad (`info`, `alta`, `crítica`)
Dashboard web: expone todo esto en una interfaz visual que se refresca sola cada 15 segundos

Capturas del dashboard

El dashboard muestra un estado general del sistema (`OK` / `ADVERTENCIA` / `CRITICO`), la lista de alertas activas con su severidad, y el detalle de puertos, servicios e intentos de login.

Arquitectura del proyecto

security-monitor/
├── modulos/
│   ├── puertos.js      → obtiene puertos escuchando vía "ss -tlnp"
│   ├── servicios.js    → obtiene estado de servicios vía "systemctl is-active"
│   ├── logs.js         → analiza intentos SSH vía "journalctl -u ssh"
│   └── alertas.js      → combina los 3 módulos anteriores y genera alertas
├── public/
│   └── index.html      → dashboard visual (HTML + CSS + JS, sin frameworks)
├── server.js            → servidor Express que expone /api/reporte
├── package.json
└── .gitignore
```
Cada módulo de datos es independiente y exporta una sola función. El módulo de alertas los combina, y el servidor solo se encarga de exponerlos vía HTTP — separación clara entre recolección de datos, lógica de negocio y capa web.

Cómo correrlo

Requisito importante: este proyecto usa comandos específicos de Linux (`ss`, `systemctl`, `journalctl`), por lo que debe ejecutarse dentro de un sistema Linux (no funciona en Windows/Mac directamente).

bash:

npm install
node server.js

Luego abre en el navegador:

http://localhost:3000

El endpoint de datos crudos está disponible en:

http://localhost:3000/api/reporte

Ejemplo de respuesta de la API

json:
{
  "fecha": "2026-09-27T19:35:56.752Z",
  "estadoGeneral": "CRITICO",
  "alertas": [
    {
      "tipo": "AUTENTICACION",
      "severidad": "critica",
      "mensaje": "Posible fuerza bruta desde ::1 (12 intentos fallidos, usuarios: usuarioinventado1, admin, root)"
    }
  ],
  "puertos": [ ... ],
  "servicios": [ ... ],
  "logs": [ ... ]
}

Cómo funciona internamente

Puertos (modulos/puertos.js): ejecuta ss -tlnp (el reemplazo moderno de netstat) y parsea su salida de texto con expresiones regulares para extraer el nombre del proceso y su PID desde un formato poco amigable (users:(("sshd",pid=1234,fd=3))).

Servicios (modulos/servicios.js): usa systemctl is-active <servicio> para cada servicio de una lista configurable. Un detalle importante: este comando devuelve un código de salida distinto de cero cuando el servicio no está activo, lo cual hace que Node.js lo trate como un error — el código captura ese caso explícitamente para leer el estado real en vez de fallar.

Logs (modulos/logs.js): reutiliza la lógica de un proyecto anterior de análisis de logs, pero en vez de leer un archivo estático, consulta journalctl -u ssh directamente, así siempre refleja los intentos de autenticación más recientes del sistema.

Alertas (modulos/alertas.js): combina los tres módulos y aplica reglas simples (servicio caído = alerta alta, intentos de fuerza bruta = alerta crítica, puertos fuera de una lista esperada = alerta informativa) para calcular un estado general.

Dashboard (public/index.html): una página sin frameworks (HTML + CSS + JavaScript plano) que consulta /api/reporte con fetch y vuelve a pintarse sola cada 15 segundos, dando la sensación de monitoreo en vivo.

Por qué lo hice así

Quería construir algo que combinara varias fuentes reales de información de seguridad de un sistema Linux (no solo una), y que expusiera esa información de forma consumible tanto para un humano (el dashboard) como para otra herramienta (el endpoint JSON). Elegí separar cada fuente de datos en su propio módulo para poder probarlos de forma aislada antes de integrarlos — esto ayudó a detectar, por ejemplo, que el comando ss no siempre expone el proceso dueño de un puerto sin privilegios elevados, y que systemctl is-active se comporta de forma distinta a lo esperado cuando un servicio está inactivo.

Limitaciones conocidas

Requiere ejecutarse en Linux (usa comandos específicos del sistema operativo)
Ver el proceso dueño de todos los puertos (incluyendo el 22/SSH) requiere ejecutar con privilegios elevados (sudo)
La lista de servicios y puertos "esperados" está fija en el código; en una versión futura podría configurarse desde un archivo externo
No hay autenticación en el dashboard ni en la API — pensado para correr en una red local de confianza, no expuesto a internet

Requisitos

Node.js 18+
Sistema operativo Linux
Acceso a journalctl (systemd)

Próximas mejoras posibles

Autenticación básica para proteger el dashboard
Notificaciones (correo, Slack) cuando el estado general pase a CRITICO
Persistencia del historial de alertas en una base de datos, en vez de recalcular todo en cada consulta
Configuración de puertos/servicios esperados desde un archivo .env o config.json