# AgrimensAPP Mobile

Aplicación móvil desarrollada con Expo y React Native para el proyecto AgrimensAPP.

## Descripción

Esta app está orientada a la gestión y consulta de trámites para usuarios registrados. Incluye:

- inicio de sesión con credenciales
- desbloqueo con huella/PIN usando `expo-local-authentication`
- sincronización con un backend remoto
- almacenamiento local de trámites con `expo-sqlite`
- almacenamiento seguro de credenciales con `expo-secure-store`
- notificaciones push con `expo-notifications`
- capacidades de background sync y tareas en segundo plano
- navegación y componentes personalizados para dashboard, notificaciones, novedades y detalles de trámite

## Requisitos

- Node.js compatible con Expo
- npm o Yarn
- Expo CLI instalado globalmente (opcional, pero recomendado)
- Android Studio / emulador Android o un dispositivo físico conectado

## Instalación

1. Abrir terminal en `mobile`
2. Instalar dependencias:

```bash
npm install
```

3. Iniciar el servidor de desarrollo:

```bash
npm run start
```

4. Ejecutar en Android:

```bash
npm run android
```

5. Ejecutar en iOS (macOS / configuración de Expo compatible):

```bash
npm run ios
```

6. Ejecutar en web:

```bash
npm run web
```

## Scripts disponibles

- `npm run start` - inicia Expo Metro bundler
- `npm run android` - ejecuta la app en un emulador/dispositivo Android
- `npm run ios` - ejecuta la app en iOS (cuando está disponible)
- `npm run web` - levanta la versión web de la app
- `npm run verify:dsisic-parser` - ejecuta la verificación del parser DSISIC definido en `scripts/verify-dsisic-parser.js`

## Configuración Expo

El proyecto usa `app.json` con configuración de Expo:

- `name`: AgrimensAPP
- `slug`: agrimensapp
- `version`: 1.0.0
- `orientation`: portrait
- `userInterfaceStyle`: dark
- `newArchEnabled`: true
- plugins: `expo-secure-store`, `expo-local-authentication`, `expo-task-manager`, `expo-notifications`, `@react-native-community/datetimepicker`, `expo-sqlite`, `expo-background-task`

## Dependencias clave

- `expo` ~54
- `react-native` 0.81.5
- `@react-native-async-storage/async-storage`
- `expo-background-task`
- `expo-local-authentication`
- `expo-notifications`
- `expo-print`
- `expo-secure-store`
- `expo-sharing`
- `expo-sqlite`
- `react-native-gesture-handler`
- `react-native-reanimated`
- `react-native-safe-area-context`
- `react-native-webview`
- `lucide-react-native`
- `zustand`

## Estructura del proyecto

- `App.tsx` - punto de entrada principal de la app
- `assets/` - iconos, splash y recursos estáticos
- `src/components/` - componentes UI reutilizables y modales
- `src/db/` - lógica de base de datos local SQLite
- `src/hooks/` - hooks personalizados para boot, autenticación, sincronización y notificaciones
- `src/screens/` - pantallas principales (`DashboardScreen`, `LoginScreen`, `NotificacionesScreen`)
- `src/services/` - servicios de sincronización y parser DSISIC
- `src/store/` - gestor de estado con `zustand`
- `src/tramites/` - consultas y generación de reportes PDF
- `src/utils/` - utilidades relacionadas con trámites

## Flujo principal

1. El usuario inicia sesión con credenciales
2. Se guarda la sesión y se sincronizan los trámites
3. La app puede solicitar autenticación biométrica o PIN al volver del fondo
4. Los trámites se almacenan localmente en SQLite y se muestran en el dashboard
5. Las novedades y notificaciones se gestionan mediante modales dedicados


