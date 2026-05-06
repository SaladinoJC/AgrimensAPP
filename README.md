# AgrimensAPP 📐

Herramienta profesional para Agrimensores. Monitorea el estado de trámites en el **Sistema de Información Catastral (SIC) de ARBA**.

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python&logoColor=white)
![Flet](https://img.shields.io/badge/Flet-0.84+-teal?logo=flutter&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-local-orange?logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/Licencia-Privado-red)

---

## Qué hace

- 🔐 **Autenticación** contra el portal SIC de ARBA (CUIT/CIT)
- 🔄 **Sincronización** automática de trámites de los últimos 60 días
- 📊 **Dashboard** con resumen visual por estado (Total, Observados, Aprobados, En Curso)
- 🔍 **Filtros** por Partido, Partida y Estado
- 🎨 **Cards con colores** por estado: Rojo (Observado), Verde (Aprobado), Ámbar (En Curso)
- 💾 **Base de datos local** SQLite para consultar offline
- 🔑 **Persistencia de credenciales** para re-login rápido


## Requisitos

- Python 3.10+
- Windows / Linux / macOS

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/TU_USUARIO/AgrimensAPP.git
cd AgrimensAPP

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar
python main.py
```

## Cómo funciona

```
Login (CUIT+CIT) → Captura JSESSIONID → Sync (POST al SIC) → Guarda en SQLite → Dashboard con filtros
```

### Pipeline paso a paso

1. **Iniciar sesión**: Ingresar CUIT y CIT de ARBA. La app captura la cookie `JSESSIONID` automáticamente.
2. **Sincronizar**: El botón 🔄 hace un POST a `PorFechaJson.do` con la cookie y trae los trámites.
3. **Ver y filtrar**: Los trámites se muestran en cards con colores. Filtrar por Partido, Partida o Estado.

### Login alternativo (cookie manual)

Si el login automático falla:
1. Ingresar manualmente a `https://www16.arba.gov.ar/DSISIC/` en el navegador
2. Copiar la cookie `JSESSIONID` desde DevTools → Application → Cookies
3. Pegarla en el campo "JSESSIONID (manual)" de la app

## Estructura del proyecto

```
AgrimensAPP/
├── main.py              # Aplicación principal (UI + DB + Red)
├── requirements.txt     # Dependencias
├── .gitignore
└── README.md
```

## Datos locales

Los datos se guardan en `~/.agrimensapp/`:

| Archivo | Contenido |
|---|---|
| `tramites.db` | Base de datos SQLite con los trámites |
| `credenciales.json` | CUIT, CIT y JSESSIONID (texto plano) |
| `app.log` | Log de debug de conexiones |

> ⚠️ **Importante**: Los archivos locales (DB, credenciales, log) están excluidos del repo vía `.gitignore`.

## Roadmap

- [x] Versión desktop funcional
- [ ] Validar integración real con credenciales de ARBA
- [ ] Migración a APK (Android) con Flet
- [ ] WebView nativo para login en móvil

## Tecnologías

- **[Flet](https://flet.dev/)** — Framework UI multiplataforma (Python → Desktop/Mobile/Web)
- **SQLite** — Base de datos local embebida
- **requests** — Cliente HTTP para comunicación con ARBA

---
