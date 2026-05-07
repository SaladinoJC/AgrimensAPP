# AgrimensAPP 📐 Mobile

Aplicación móvil corporativa para Agrimensores. Permite monitorear el estado de trámites en el **Sistema de Información Catastral (SIC) de ARBA** directamente desde el celular, con notificaciones en segundo plano y acceso offline.

![React Native](https://img.shields.io/badge/React_Native-Expo-blue?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-local-orange?logo=sqlite&logoColor=white)
![Security](https://img.shields.io/badge/Biometría-Activada-success)

---

## Características Principales

- 🔐 **Seguridad Extrema:** Acceso a la app mediante Huella Digital/FaceID.
- 🔄 **Scraping Silencioso:** Sincronización automática de trámites con bypass del SSO de ARBA.
- 🔔 **Notificaciones Push:** Avisos automáticos cada vez que un trámite cambia de estado, incluso con la app cerrada.
- 💾 **Consultas Offline:** Motor SQLite integrado que permite revisar 1000+ trámites sin conexión a internet.
- 📊 **Dashboard:** Resumen visual por estado (Observados, Aprobados, En Curso) con tarjetas dinámicas.
- 📅 **Filtros Avanzados:** Buscador por texto, selectores de fecha nativos, partido y partida.
- 📄 **Exportación:** Generación de reportes PDF y envío directo por WhatsApp.

## Requisitos

- Node.js (v18 o superior)
- Cuenta en [Expo](https://expo.dev)
- Teléfono Android/iOS o emulador

## Instalación y Ejecución Local

```bash
# Clonar el repositorio
git clone https://github.com/TU_USUARIO/AgrimensAPP.git
cd AgrimensAPP/mobile

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npx expo start
```

## Compilación (APK para Android)

Para generar el archivo instalable definitivo `.apk`:

```bash
npx eas-cli login
npx eas-cli build -p android --profile preview
```
*(Descargar el APK desde el enlace generado al finalizar la compilación).*

## Arquitectura

- **`/src/db`**: Capa de persistencia local optimizada con transacciones SQLite.
- **`/src/services`**: Motores de sincronización (WebView inyectado y Fetch nativo para segundo plano).
- **`/src/store`**: Gestión del estado global de la aplicación (Zustand).

> **Nota:** La versión preliminar de escritorio (Python/Flet) ha sido archivada en el directorio `/desktop`.

---
*⚠️ IMPORTANTE: Esta aplicación NO es oficial, NO está afiliada, ni representa a ARBA ni a ninguna entidad gubernamental de la Provincia de Buenos Aires. Es una herramienta independiente de gestión para Agrimensores.*
