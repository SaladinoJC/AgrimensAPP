# CONTEXT — AgrimensAPP

Aplicación móvil (Expo/React Native) para Agrimensores. Monitorea **Trámites** en **SIC ARBA (DSISIC)**, con **sincronización automática**, **offline** (SQLite), **notificaciones** por cambios de estado y **seguridad biométrica**.

## Vocabulario de dominio (glosario)

- **ARBA**: Agencia de Recaudación Provincia de Buenos Aires. Sistema consultado por la app.
- **SIC / DSISIC**: Sistema de Información Catastral (frontend web que la app consulta).
- **SSO**: Single Sign-On de ARBA. Paso de autenticación previo a DSISIC.
- **Cuenta ARBA**: credenciales (CUIT/CIT) usadas para autenticarse en ARBA/DSISIC.
- **Trámite**: unidad principal que se consulta/almacena.
- **Número de Trámite**: identificador “visible” que viene de ARBA (puede venir como `nroExpediente` o `numeroTramite` según payload).
- **Identidad de Trámite**: clave estable usada para deduplicar/actualizar un Trámite en almacenamiento local. **Por ahora**: `Número de Trámite` (alineado con PK actual).  
  _Si aparecen colisiones, migrar a tupla \(`Origen de Trámite`, `Número de Trámite`\)._
- **Estado**: situación actual de un Trámite (p.ej. “EN CURSO”, “FINALIZADO”, “RECHAZADO”).
- **Novedad**: cambio detectado cuando **Estado viejo != Estado nuevo** para misma **Identidad de Trámite**. Única condición que dispara notificación por defecto.
- **Actualización**: cambio detectado en campos de un Trámite **distintos de Estado** (p.ej. fechas/metadata). Por defecto **no** dispara notificación.
- **Bandeja de Novedades**: lista en memoria de Novedades recientes para mostrar al usuario. Por defecto **no** persiste entre reinicios.
- **Partido / Partida**: campos de filtro/identificación de Trámite.
- **Origen de Trámite**: texto provisto por ARBA que indica procedencia/canal del Trámite.
- **Sincronización**: operación que autentica, consulta ARBA y actualiza DB local.
- **Offline**: navegación/consultas desde SQLite sin conexión.
- **Dashboard**: resumen por estado (contadores/agrupación).
- **Reporte PDF**: exportación bajo demanda de **un Trámite seleccionado**. Flujo: usuario abre Trámite → botón “Exportar” → genera `.pdf` con datos de ese Trámite.
- **Campos PDF (mínimo)**: Número, Estado, Partido, Partida, Nomenclatura, Tipo trámite, Origen, Fecha alta, Fecha movimiento, Oblea, Demora, Final estimada.
- **Formato PDF (fechas)**: `dd/MM/yyyy` en timezone local del dispositivo.

## Integraciones y constraints (seams)

- **ARBA / DSISIC (scraping)**:
  - **URL base**: `https://www16.arba.gov.ar/DSISIC/`
  - **Login SSO**: aparece pantalla con campo `lt` en HTML; luego POST credenciales.
  - **Asignación de rol**: POST a `DSISIC/asignarRol.do` con rol `UsuarioExterno`.
  - **Consulta de trámites por fecha**: pantalla `consultaFechas.jsp` + POST a `DSISIC/PorFechaJson.do`.
  - **Encoding**: respuesta se decodifica como `iso-8859-1` y luego se extrae un JSON embebido en HTML.
  - **Volatilidad**: selectores DOM, nombres de campos y HTML pueden cambiar; tratar como integración frágil.

- **Background sync (Expo)**:
  - **Mecanismos**: `expo-background-fetch`, `expo-task-manager`.
  - **Frecuencia**: configurable. Default cada ~3 horas (según `ESTADO_PROYECTO.md`), con presets (p.ej. 1h/3h/6h) y opción “solo manual”.
  - **Restricciones**: comportamiento depende de SO, permisos, y políticas de batería.

- **Notificaciones (locales)**:
  - **Mecanismo**: `expo-notifications`.
  - **Evento**: se emite cuando hay Novedades.
  - **Política**: una sola notificación **agregada** por corrida de Sincronización (p.ej. “se actualizaron N trámite(s)”).

- **Seguridad**:
  - **Biometría**: `expo-local-authentication` para proteger acceso a datos.
  - **Secreto local**: credenciales almacenadas en `expo-secure-store`.
  - **Política**: si biometría no está disponible o no está enrolada, usar **fallback** (PIN local o passcode del dispositivo) antes de permitir acceso a datos.

## Alcance (no-goals por ahora)

- **Cuentas**: la app soporta **una sola Cuenta ARBA** por dispositivo (sin multi-cuenta).

## Datos locales (SQLite)

- **Tecnología**: `expo-sqlite` (base `tramites.db`).
- **Entidad persistida**: tabla `tramites`.
- **Clave primaria**: `nroExpediente`.
- **Campos relevantes** (actual): `partido`, `partida`, `estado`, `fecha_movimiento`, `ultima_sincronizacion`, `tipo_tramite`, `nomenclatura`, `origen`, `fecha_alta`, `oblea`, `demora`, `final_estimada`.
- **Política**: cambio de credenciales **borra datos locales** ejecutando `DELETE FROM tramites` (mantener schema/archivo DB).

## Módulos actuales (por carpeta)

- `mobile/src/services/`
  - `ArbaWebView.tsx`: adapter WebView para navegar/login e invocar consulta (inyección JS).
  - `HeadlessSync.ts`: adapter headless con `fetch` para login/consulta en background + notificación por Novedades.
- `mobile/src/db/`
  - `database.ts`: init DB, upsert, queries, stats.
- `mobile/src/store/`
  - `useStore.ts`: estado global (credenciales en memoria, bandera `isSyncing`, lista `novedades`).

## Políticas/Reglas de negocio observadas

- **Ventana de consulta por fechas**: configurable. Default “último año” (`hoy` a `hoy - 1 año`) para Sincronización, con opción de acortar/expandir rango.
- **Novedad**: se detecta por cambio de `estado` (case-insensitive) para mismo `nroExpediente`.
- **Ordenamiento de listados**: por `fecha_alta` descendente (según query actual).
- **Errores de Sincronización**: clasificar en **Credenciales inválidas**, **ARBA no disponible**, **Error técnico**. UI muestra mensaje corto + “reintentar”. Background evita spam de notificaciones por error.
- **Dashboard (categorías de Estado)**: agrupar Estados en `en_curso`, `finalizados`, `rechazados`, `otros` usando matching case-insensitive por texto libre (p.ej. contiene “FINALIZADO/ENTREGADO”, “RECHAZADO”, “EN CURSO/EN TRAMITE/PENDIENTE”). Preparado para override futuro.
- **Filtros (Partida)**: tratar `Partida` como texto. Matching por “contiene” es default; opción “exacta” queda para futuro.

## Riesgos conocidos / puntos frágiles

- **Scraping/SSO**: cambios en HTML, campos, endpoints o encoding rompen sincronización.
- **Duplicación de flujo ARBA**: hay 2 adapters (WebView + headless) que replican pasos similares; riesgo de drift.
- **Performance upsert**: posible patrón N+1 al comparar estados previos por fila.

## Deepening opportunities (arquitectura)

Objetivo: subir **depth** (más comportamiento detrás de interfaces chicas), mejorar **locality** (cambios/bugs concentrados), crear **seams** reales con **adapters** intercambiables, y aumentar **leverage** para callers.  
Vocabulario de dominio: **Trámite**, **Sincronización**, **Novedad**, **Estado**, **ARBA/DSISIC**, **Offline**.

1) **Módulo `Sincronización` para ARBA/DSISIC (seam real: 2 adapters)**
   - **Files**: `mobile/src/services/ArbaWebView.tsx`, `mobile/src/services/HeadlessSync.ts`, `mobile/App.tsx`
   - **Problem**: flujo SSO/asignarRol/consultaFechas/PorFechaJson + parsing/encoding duplicado en 2 adapters → drift, baja locality para roturas por cambios ARBA.
   - **Solution**: extraer module “Sincronización” con interface estable (“obtener filas Trámite para rango fechas”) y dejar 2 adapters detrás del seam:
     - adapter WebView (inyección JS/DOM)
     - adapter headless (fetch/cookies)
   - **Benefits**: leverage (1 lugar para lógica), locality (arreglo único), test surface claro por interface (parser/errores/flujo).

2) **Módulo `ParserDSISIC` (ArrayBuffer -> filas Trámite | error)**
   - **Files**: `mobile/src/services/HeadlessSync.ts`, `mobile/src/services/ArbaWebView.tsx`, fixtures en `desktop/*.html`
   - **Problem**: parsing frágil repetido (iso-8859-1 + regex JSON embebido) con error modes inconsistentes.
   - **Solution**: module `ParserDSISIC` con interface `parsePorFechaResponse(buffer)`.
   - **Benefits**: tests determinísticos con fixtures, locality para cambios ARBA (HTML/campos/encoding).

3) **DB module más profundo: eliminar N+1 en `upsertTramites`**
   - **Files**: `mobile/src/db/database.ts`
   - **Problem**: por cada Trámite hace `SELECT estado ...` (N+1) + upsert; regla de Novedad mezclada con SQL.
   - **Solution**: preleer estados en batch (map/IN/temp) y calcular Novedades en memoria; upsert batch dentro transacción.
   - **Benefits**: leverage (callers no piensan performance), locality (regla Novedad concentrada), tests por interface DB.

4) **Módulo `Novedades` (política única para foreground/background)**
   - **Files**: `mobile/src/db/database.ts`, `mobile/src/services/HeadlessSync.ts`, `mobile/App.tsx`
   - **Problem**: policy repartida: detección, notificación agregada, modal UI; clasificación de errores de Sincronización no está centralizada.
   - **Solution**: module `Novedades` (diff Estado viejo/nuevo + build notificación agregada + decisión de “disparar o no”).
   - **Benefits**: consistency, locality, tests de reglas (case-insensitive, “solo Estado dispara”).

5) **Reducir shallow module `App.tsx` (UI + orquestación + seams Expo mezclados)**
   - **Files**: `mobile/App.tsx`
   - **Problem**: interfaz “render App” casi tan compleja como implementación → baja depth; cambios se pisan (Sincronización, Auth local, BackgroundFetch, Reporte PDF).
   - **Solution**: extraer modules por concepto/seam: `BackgroundSyncRegistration`, `ReportePDF`, `AuthLocal`, `TramitesQuery`.
   - **Benefits**: locality por concepto, tests por interface sin renderizar toda la app.

6) **Alinear `AuthLocal` con policy de seguridad**
   - **Files**: `mobile/App.tsx`
   - **Problem**: si no hay hardware o biometría enrolada → bypass (`setIsAuthenticated(true)`), contradice policy: usar fallback (PIN/passcode) antes de permitir acceso.
   - **Solution**: module `AuthLocal` con interface “gate acceso” y adapters “biometría”/“fallback”; nunca bypass silencioso.
   - **Benefits**: security + locality + tests de estados (no-hardware/no-enrolled/cancel/fail).

