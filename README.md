# AgrimensAPP Mobile

Aplicación móvil desarrollada con Expo y React Native para el proyecto AgrimensAPP.

## ¿Para qué sirve esta app?

AgrimensAPP Mobile permite a profesionales y usuarios registrados monitorear trámites ARBA/DSISIC, consultar estados, ver detalles y descargar documentación asociada a cada expediente.

La aplicación está pensada para facilitar el seguimiento de trámites administrativos y detectar novedades de estado sin tener que ingresar manualmente al portal ARBA.

## Cómo funciona

1. Al iniciar, la app inicializa la base de datos SQLite y restaura la sesión si el usuario ya estaba logueado.
2. El usuario ingresa sus credenciales ARBA (CUIT y CIT).
3. Las credenciales se guardan de forma segura en `expo-secure-store`.
4. El dashboard permite sincronizar trámites y aplicar filtros por fecha, número, partido, partida, estado y tipo de trámite.
5. La sincronización intenta primero un flujo headless . Si falla, se usa una `WebView` oculta como fallback.
6. Los trámites llegan a la base de datos local , donde se guardan y se calculan novedades cuando cambia el estado.
7. El usuario puede abrir el historial de novedades, ver detalle de un trámite y descargar documentos adjuntos.
8. Si la app se reinicia desde el fondo después de más de 5 minutos, solicita desbloqueo biométrico/PIN.

## Estructura principal del proyecto

- `App.tsx`: componente raíz. Controla el estado global, el acceso protegido y el renderizado de pantallas.
- `app.json`: configuración de Expo, permisos Android y plugins.
- `package.json`: dependencias del proyecto móvil y scripts disponibles.
- `src/store/useStore.ts`: almacén global con `zustand` para credenciales, filtros, paginación, novedades, sincronización y tema.
- `src/db/database.ts`: inicializa SQLite y define consultas e inserciones para trámites y notificaciones.
- `src/hooks/useAppBoot.ts`: arranque de la app y restauración de sesión y tema desde almacenamiento.
- `src/hooks/useAuthManager.ts`: logout, limpieza de datos y verificación biométrica/PIN.
- `src/hooks/useSincronizador.tsx`: coordina la sincronización de trámites y fallback a WebView.
- `src/hooks/useTramiteArba.tsx`: carga detalles adicionales de trámites y maneja descarga/compartir archivos.
- `src/screens/LoginScreen.tsx`: formulario de login y autenticación biométrica.
- `src/screens/DashboardScreen.tsx`: vista principal con sincronización, filtros y lista de trámites.
- `src/screens/NotificacionesScreen.tsx`: historial de novedades y detalle de expedientes.
- `src/components/arba/ArbaWebView.tsx`: WebView oculta para automatizar login y extracción de datos de ARBA.
- `src/services/sync/headlessAdapter.ts`: sincronización headless contra ARBA.
- `src/services/sync/parserDsisic.ts`: parseo de HTML/ISO-8859-1 para extraer JSON.
- `src/services/sync/arbaService.ts`: obtiene detalles y lista de archivos de un trámite.

## Dependencias usadas y su funcionalidad

### Dependencias principales

- `expo`: plataforma base para ejecutar la app con Expo.
- `expo-file-system`: lee, escribe y valida archivos locales, principalmente para documentos descargados.
- `expo-local-authentication`: habilita huella, rostro o PIN para desbloquear la app.
- `expo-secure-store`: almacena CUIT/CIT cifrados en el dispositivo.
- `expo-sharing`: comparte archivos descargados con otras apps.
- `expo-splash-screen`: controla la pantalla inicial de carga.
- `expo-sqlite`: almacena los trámites y notificaciones localmente en SQLite.
- `expo-status-bar`: gestiona el estilo de la barra de estado.
- `@react-native-async-storage/async-storage`: persistencia simple.
- `@react-native-community/datetimepicker`: seleccionadores de fechas para filtros.
- `react-native-webview`: ejecuta el fallback oculto para login y extracción de datos de ARBA.
- `react-native-gesture-handler`: gestos y swipe en el historial de notificaciones.
- `react-native-reanimated`: animaciones y soporte de gestos para swipe.
- `react-native-safe-area-context`: adapta la interfaz a las áreas seguras de la pantalla.
- `react-native-worklets`: dependencia auxiliar necesaria para `react-native-reanimated`.
- `lucide-react-native`: iconos vectoriales usados en la UI.
- `zustand`: estado global ligero para la app.


## Flujo de login y sesión

- `LoginScreen` permite guardar CUIT/CIT en `expo-secure-store`.
- Si el dispositivo es compatible, muestra un botón de inicio con huella/rostro.
- `useAuthManager` usa `authLocal` para desbloquear la app cuando vuelve del fondo después de 5 minutos.
- En el logout se eliminan credenciales y datos locales: tramites y notificaciones.

## Flujo de sincronización de ARBA

- `useSincronizador` intenta primero `sincronizarPorFechaHeadless`.
- Si ocurre un error técnico, usa `ArbaWebView` para iniciar sesión y extraer el HTML necesario.
- La respuesta se parsea con `parserDsisic` para obtener el listado de trámites.
- `upsertTramites` inserta/actualiza los trámites y registra novedades si cambia el estado.
- El dashboard refresca la lista y muestra notificaciones si hay cambios.

## Gestión de filtros y listado

- `SearchFilters` permite filtrar por:
  - búsquedas de texto libre
  - rango de fechas
  - partido
  - partida
  - tipo de trámite
  - estado de tramite
- `TramiteList` muestra resultados paginados y usa `TramiteDetailModal` para ver cada expediente.
- `PaginationControl` permite avanzar o retroceder páginas según el total de registros.

## Consultas y archivos de trámites

- `TramiteDetailModal` muestra el detalle del expediente almacenado.
- `useTramiteArba` carga:
  - detalles adicionales del trámite desde ARBA
  - lista de archivos adjuntos
- Los archivos pueden descargarse localmente y abrirse con una app externa en Android, o compartirse desde el dispositivo.

## Instalación y ejecución

Desde la carpeta `mobile`:

```bash
npm install
npm run start
```

Para ejecutar en Android:

```bash
npm run android
```

Para ejecutar en iOS (si está disponible en tu entorno):

```bash
npm run ios
```

Para correr la app en web:

```bash
npm run web
```

## Scripts disponibles

- `npm run start`: inicia Expo Packager.
- `npm run android`: abre la app en Android.
- `npm run ios`: abre la app en iOS.
- `npm run web`: ejecuta la app en modo web.
- `npm run verify:dsisic-parser`: valida el parser DSISIC con `scripts/verify-dsisic-parser.js`.

## Notas importantes

- La app depende de los servicios de ARBA/DSISIC para obtener trámites y documentos.
- Las credenciales se guardan localmente y de forma segura, pero el acceso remoto depende de la disponibilidad de ARBA.
- El modo biométrico protege el acceso cuando la app vuelve del fondo después de un tiempo.
- La sincronización combina un flujo headless y un fallback WebView para mejorar robustez.


