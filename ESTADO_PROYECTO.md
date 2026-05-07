# Estado del Proyecto: AgrimensAPP - Monitor ARBA SIC

## 1. Objetivo del Proyecto
Desarrollar una aplicación de escritorio profesional para Agrimensores que permita monitorear el estado de trámites en el Sistema de Información Catastral (SIC) de ARBA de forma automatizada, evitando el ingreso manual repetitivo al portal web.

## 2. Resumen Técnico
- **Lenguaje:** Python 3.x
- **Framework UI:** Flet (basado en Flutter)
- **Persistencia:** SQLite local (`~/.agrimensapp/tramites.db`)
- **Comunicación:** Requests con manejo de Sesiones, SSO (Single Sign-On) y Scraping de HTML/JSON.

## 3. Avances Logrados hasta el Momento

### ✅ Integración con ARBA (Punto Crítico)
- **Autenticación Completa:** Se logró automatizar el flujo complejo de ARBA:
    1. Captura de token `lt` dinámico.
    2. Login vía SSO con CUIT y CIT.
    3. Asignación automática de Rol (`UsuarioExterno`).
    4. Inicialización de sesión de consulta en `consultaFechas.jsp`.
- **Extracción de Datos:** Implementación de un motor de búsqueda que extrae el JSON embebido dentro de la respuesta HTML del SIC.
- **Volumen de Datos:** En las pruebas iniciales se sincronizaron con éxito más de **1,100 trámites reales**.

### ✅ Arquitectura de Datos
- **Base de Datos Robusta:** El esquema de SQLite incluye ahora:
    - Número de Trámite / Oblea.
    - Partido y Partida.
    - Nomenclatura Catastral completa.
    - Fecha de Alta y Fecha de último movimiento.
    - Tipo de Trámite (Descripción).
    - Estado actual.

### ✅ Interfaz de Usuario (Dashboard)
- **Diseño Premium:** Interfaz en modo oscuro con estética moderna y profesional.
- **Dashboard Estadístico:** Contadores automáticos de trámites Totales, Rechazados, Finalizados y En Curso.
- **Búsqueda Universal:** Barra superior que filtra en tiempo real por cualquier campo (partida, partido, nomenclatura, nro de trámite).
- **Filtros Avanzados:** 
    - Rango de fechas (Desde / Hasta).
    - Filtros específicos por Partido y Partida.
- **Tarjetas Dinámicas:** Visualización clara de cada trámite con iconos y colores codificados según el estado (Verde = Finalizado, Rojo = Rechazado, Ámbar = En Curso).

## 4. Funcionamiento Actual (Pipeline)
1. El usuario ingresa sus credenciales una sola vez (se guardan localmente de forma segura).
2. Al presionar **Sincronizar**, la app:
    - Se loguea en ARBA en segundo plano.
    - Descarga todos los trámites del último año.
    - Actualiza la base de datos local (solo cambia lo nuevo).
3. El usuario puede consultar, filtrar y buscar sus trámites instantáneamente sin depender de la velocidad del portal de ARBA.

## 5. Próximos Pasos Sugeridos
- Implementar notificaciones cuando un trámite cambie de estado.
- Exportación de resultados a Excel/PDF.
- Cifrado de credenciales locales para mayor seguridad.
- Empaquetado de la aplicación en un `.exe` para distribución.

---
**Fecha de actualización:** 6 de mayo de 2026
**Desarrollado por:** Antigravity AI (Google DeepMind)
