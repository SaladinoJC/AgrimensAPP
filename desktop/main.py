"""
AgrimensAPP - Monitor de Trámites SIC/ARBA
Versión Desktop (Windows) con Flet 0.84+
"""

import flet as ft
from flet import Border, BorderSide
import sqlite3
import requests
import json
import os
import logging
import threading
import urllib3
from datetime import datetime, timedelta

# ─── Logging ───
LOG_PATH = os.path.join(os.path.expanduser("~"), ".agrimensapp", "app.log")
logging.basicConfig(filename=LOG_PATH, level=logging.DEBUG,
                    format="%(asctime)s [%(levelname)s] %(message)s")

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ─── Paths ───
APP_DIR = os.path.join(os.path.expanduser("~"), ".agrimensapp")
os.makedirs(APP_DIR, exist_ok=True)
DB_PATH = os.path.join(APP_DIR, "tramites.db")
CREDS_PATH = os.path.join(APP_DIR, "credenciales.json")

# ─── Colores ───
C_BG = "#0f1724"
C_SURFACE = "#182136"
C_CARD = "#1e2a42"
C_PRIMARY = "#00bfa5"
C_ACCENT = "#4fc3f7"
C_RED = "#ef5350"
C_GREEN = "#66bb6a"
C_AMBER = "#ffca28"
C_GREY = "#78909c"
C_TEXT = "#eceff1"
C_TEXT2 = "#90a4ae"

# ─── Database ───
def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""CREATE TABLE IF NOT EXISTS tramites (
        nroExpediente TEXT PRIMARY KEY,
        partido TEXT, partida TEXT, estado TEXT,
        fecha_movimiento TEXT, ultima_sincronizacion TEXT,
        tipo_tramite TEXT, nomenclatura TEXT, origen TEXT,
        fecha_alta TEXT, oblea TEXT, demora TEXT, final_estimada TEXT
    )""")
    # Migrar tabla vieja (agregar columnas nuevas si faltan)
    for col, default in [("tipo_tramite","''"),("nomenclatura","''"),("origen","''"),("fecha_alta","''"),("oblea","''"), ("demora","''"), ("final_estimada","''")]:
        try:
            conn.execute(f"ALTER TABLE tramites ADD COLUMN {col} TEXT DEFAULT {default}")
        except:
            pass
    conn.commit()
    conn.close()

def upsert_tramites(rows):
    conn = sqlite3.connect(DB_PATH)
    novedades = []
    for r in rows:
        nro = str(r.get("numeroTramite", r.get("nroExpediente", "")))
        estado = r.get("estado", "")
        
        # Check novedades
        viejo = conn.execute("SELECT estado FROM tramites WHERE nroExpediente=?", (nro,)).fetchone()
        if viejo:
            estado_viejo = viejo[0]
            if estado_viejo and estado_viejo.upper() != estado.upper():
                novedades.append({"nro": nro, "viejo": estado_viejo, "nuevo": estado})

        fecha_estado = r.get("fechaEstado", r.get("fecha_movimiento", ""))
        fecha_alta = r.get("fechaAlta", r.get("fecha_alta", ""))
        tipo = r.get("tramite", r.get("tipo_tramite", ""))
        nomenclatura = str(r.get("nomenclatura", "")).strip()
        origen = r.get("origen", "")
        oblea = str(r.get("oblea", ""))
        demora = str(r.get("demora", ""))
        final_est = str(r.get("finalEstimada", ""))
        
        conn.execute("""INSERT OR REPLACE INTO tramites
            (nroExpediente, partido, partida, estado, fecha_movimiento,
             ultima_sincronizacion, tipo_tramite, nomenclatura, origen,
             fecha_alta, oblea, demora, final_estimada)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (nro, partido, partida, estado, fecha_estado,
             datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
             tipo, nomenclatura, origen, fecha_alta, oblea, demora, final_est))
    conn.commit()
    conn.close()
    return novedades

def get_tramites(search=None, fecha_desde=None, fecha_hasta=None,
                 filtro_partido=None, filtro_partida=None, offset=0):
    """Consulta trámites con filtros combinados."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    q = "SELECT * FROM tramites WHERE 1=1"
    params = []
    if fecha_desde:
        q += " AND fecha_alta >= ?"
        params.append(fecha_desde)
    if fecha_hasta:
        q += " AND fecha_alta <= ?"
        params.append(fecha_hasta)
    if filtro_partido:
        q += " AND partido=?"
        params.append(filtro_partido)
    if filtro_partida:
        q += " AND partida LIKE ?"
        params.append(f"%{filtro_partida}%")
    if search:
        s = f"%{search}%"
        q += (" AND (nroExpediente LIKE ? OR partido LIKE ? OR partida LIKE ?"
              " OR nomenclatura LIKE ? OR tipo_tramite LIKE ? OR estado LIKE ?"
              " OR oblea LIKE ?)")
        params.extend([s, s, s, s, s, s, s])
    q += " ORDER BY fecha_alta DESC LIMIT 50 OFFSET ?"
    params.append(offset)
    rows = [dict(r) for r in conn.execute(q, params).fetchall()]
    conn.close()
    return rows

def get_unique_col(col):
    conn = sqlite3.connect(DB_PATH)
    vals = [r[0] for r in conn.execute(
        f"SELECT DISTINCT {col} FROM tramites WHERE {col}!='' ORDER BY {col}"
    ).fetchall()]
    conn.close()
    return vals

def get_stats():
    conn = sqlite3.connect(DB_PATH)
    total = conn.execute("SELECT COUNT(*) FROM tramites").fetchone()[0]
    rechazados = conn.execute("SELECT COUNT(*) FROM tramites WHERE UPPER(estado) LIKE '%RECHAZ%'").fetchone()[0]
    finalizados = conn.execute("SELECT COUNT(*) FROM tramites WHERE UPPER(estado) LIKE '%FINALIZ%' OR UPPER(estado) LIKE '%ENTREGADO%'").fetchone()[0]
    en_curso = conn.execute("SELECT COUNT(*) FROM tramites WHERE UPPER(estado) IN ('EN CURSO','EN TRAMITE')").fetchone()[0]
    conn.close()
    return {"total": total, "rechazados": rechazados, "finalizados": finalizados, "en_curso": en_curso}

# ─── Credenciales ───
def load_creds():
    if os.path.exists(CREDS_PATH):
        with open(CREDS_PATH, "r") as f:
            return json.load(f)
    return {"cuit": "", "cit": "", "jsessionid": ""}

def save_creds(data):
    with open(CREDS_PATH, "w") as f:
        json.dump(data, f)

# ─── Red ───
import re as _re

def login_arba(cuit, cit):
    """Login completo al SIC via SSO de ARBA. Devuelve (session, error)."""
    s = requests.Session()
    try:
        logging.info(f"Login SSO para CUIT={cuit}")
        # 1. GET inicial → redirige al SSO
        r1 = s.get("https://www16.arba.gov.ar/DSISIC/", verify=False, timeout=15, allow_redirects=True)
        lt_match = _re.search(r'name="lt"\s+value="([^"]+)"', r1.text)
        if not lt_match:
            return None, "No se encontró la página de login de ARBA."
        # 2. POST login al SSO
        r2 = s.post(r1.url, data={
            "version": "2", "CUIT": cuit, "clave_Cuit": cit,
            "USER": "", "clave_Host": "", "DOMAIN": "", "clave_Dominio": "",
            "lt": lt_match.group(1), "username": cuit, "password": cit,
            "userComponent": "CUIT",
        }, verify=False, timeout=15, allow_redirects=True)
        if "DSISIC" not in r2.url:
            return None, "Credenciales inválidas o SSO rechazó el login."
        # 3. Asignar Rol
        s.post("https://www16.arba.gov.ar/DSISIC/asignarRol.do", data={
            "metodo": "asignarRol", "usuario": cuit, "rol": "UsuarioExterno",
        }, verify=False, timeout=15, allow_redirects=True)
        logging.info("Login SSO + Rol OK")
        return s, None
    except Exception as e:
        logging.error(f"Login error: {e}", exc_info=True)
        return None, f"Error de conexión: {str(e)}"

def sync_tramites(session_or_jsid, cuit=None, cit=None):
    """Sincroniza trámites desde SIC ARBA.
    Acepta una requests.Session ya autenticada, o credenciales para crear una nueva."""
    # Si recibimos credenciales, hacer login primero
    if isinstance(session_or_jsid, str):
        if not cuit or not cit:
            return 0, "Se requieren credenciales para sincronizar."
        session, err = login_arba(cuit, cit)
        if err:
            return 0, err
    else:
        session = session_or_jsid

    hoy = datetime.now()
    desde = (hoy - timedelta(days=365)).strftime("%Y-%m-%d")
    hasta = hoy.strftime("%Y-%m-%d")
    logging.info(f"Sync iniciado: desde={desde}, hasta={hasta}")
    try:
        # Visitar consultaFechas.jsp para inicializar la sesión de consulta
        session.get(
            "https://www16.arba.gov.ar/DSISIC/jsp/consultas/consultaFechas.jsp?metodo=porFechaPdoPdaJson",
            verify=False, timeout=15)
        # POST al endpoint de búsqueda por fecha
        resp = session.post(
            "https://www16.arba.gov.ar/DSISIC/PorFechaJson.do",
            data={
                "opcion": "FEC", "metodo": "porFechaPdoPdaJson",
                "tipoBusqueda": "FEC", "fechaDesde": desde, "fechaHasta": hasta,
            },
            verify=False, timeout=60
        )
        logging.info(f"Respuesta HTTP {resp.status_code}, len={len(resp.text)}")
        if resp.status_code != 200:
            return 0, f"Error HTTP {resp.status_code}"
        # Extraer JSON embebido en el HTML
        json_match = _re.search(r'(\[\s*\{.*\}\s*\])', resp.text, _re.DOTALL)
        if not json_match:
            logging.error("No se encontró JSON en la respuesta HTML")
            return 0, "No se encontraron trámites. ¿Sesión expirada?", []
        rows = json.loads(json_match.group(1))
        logging.info(f"Parseados {len(rows)} trámites")
        if rows:
            logging.info(f"Keys: {list(rows[0].keys())}")
            novedades = upsert_tramites(rows)
            return len(rows), None, novedades
        return 0, "Respuesta sin trámites.", []
    except json.JSONDecodeError as e:
        logging.error(f"JSONDecodeError: {e}")
        return 0, "Error parseando datos del SIC.", []
    except requests.exceptions.ConnectionError:
        logging.error("ConnectionError al SIC")
        return 0, "No se pudo conectar al SIC. ¿Está disponible?", []
    except Exception as e:
        logging.error(f"Exception en sync: {e}", exc_info=True)
        return 0, f"Error: {str(e)}", []

# ─── UI ───
def main(page: ft.Page):
    init_db()
    creds = load_creds()

    page.title = "AgrimensAPP - Monitor SIC"
    page.bgcolor = C_BG
    page.padding = 0
    page.theme_mode = ft.ThemeMode.DARK
    page.theme = ft.Theme(color_scheme_seed=C_PRIMARY)
    page.window.width = 900
    page.window.height = 700

    # ─── State ───
    state = {"page": 0}
    ocultar_en_curso = True

    # ─── Helpers ───
    def color_for_estado(estado):
        e = (estado or "").upper()
        if "RECHAZ" in e: return C_RED
        if "FINALIZ" in e or "ENTREGADO" in e: return C_GREEN
        if "EN CURSO" in e or "EN TRAMITE" in e or "PENDIENTE" in e: return C_AMBER
        return C_GREY

    def icon_for_estado(estado):
        e = (estado or "").upper()
        if "RECHAZ" in e: return ft.Icons.WARNING_ROUNDED
        if "FINALIZ" in e or "ENTREGADO" in e: return ft.Icons.CHECK_CIRCLE_ROUNDED
        if "EN CURSO" in e or "EN TRAMITE" in e or "PENDIENTE" in e: return ft.Icons.HOURGLASS_TOP_ROUNDED
        return ft.Icons.DESCRIPTION_ROUNDED

    def close_any_dlg(dlg):
        dlg.open = False
        page.update()

    def show_detalle(t):
        content = ft.Column([
            ft.Text(f"Trámite: {t.get('nroExpediente', '—')} - Oblea: {t.get('oblea', '—')}", weight=ft.FontWeight.BOLD, size=16),
            ft.Text(f"Estado: {t.get('estado')}", color=color_for_estado(t.get("estado")), weight=ft.FontWeight.W_600),
            ft.Divider(),
            ft.Text(f"Tipo: {t.get('tipo_tramite', '—')}"),
            ft.Text(f"Partido: {t.get('partido', '—')}  |  Partida: {t.get('partida', '—')}"),
            ft.Text(f"Nomenclatura: {t.get('nomenclatura', '—')}"),
            ft.Text(f"Fecha Alta: {t.get('fecha_alta', '—')}  |  Último Mov: {t.get('fecha_movimiento', '—')}"),
            ft.Text(f"Días de Demora: {t.get('demora', 'N/A')}", visible=bool(t.get('demora'))),
            ft.Text(f"Final Estimada: {t.get('final_estimada', 'N/A')}", visible=bool(t.get('final_estimada'))),
            ft.Divider(),
            ft.Text(f"Última Sincronización: {t.get('ultima_sincronizacion', '')}", size=10, color=C_TEXT2),
        ], spacing=8, tight=True)
        
        dlg = ft.AlertDialog(
            title=ft.Text("Detalles del Trámite", color=C_ACCENT),
            content=content,
            bgcolor=C_SURFACE,
            actions=[ft.TextButton("Cerrar", on_click=lambda e: close_any_dlg(dlg))]
        )
        page.overlay.append(dlg)
        dlg.open = True
        page.update()

    def show_novedades(novedades):
        content = ft.Column([
            ft.Container(
                content=ft.Text(f"#{n['nro']} pasó de '{n['viejo']}' a '{n['nuevo']}'", size=13),
                padding=8, bgcolor=C_CARD, border_radius=8, margin=ft.Margin(0,0,0,4)
            ) for n in novedades
        ], scroll=ft.ScrollMode.AUTO, height=250, tight=True)
        
        dlg = ft.AlertDialog(
            title=ft.Row([ft.Icon(ft.Icons.NOTIFICATIONS_ACTIVE_ROUNDED, color=C_AMBER), ft.Text("Novedades", color=C_TEXT)]),
            content=content,
            bgcolor=C_SURFACE,
            actions=[ft.TextButton("Cerrar", on_click=lambda e: close_any_dlg(dlg))]
        )
        page.overlay.append(dlg)
        dlg.open = True
        page.update()

    def make_tramite_card(t):
        estado = t.get("estado", "")
        col = color_for_estado(estado)
        fg_col = "#ffffff" if col == C_RED else C_BG

        nro = t.get('nroExpediente', '—')
        oblea = t.get('oblea', '')
        id_text = f"#{nro}"
        if oblea and oblea != 'None' and oblea:
            id_text += f"  ·  Oblea {oblea}"
        nom = t.get('nomenclatura', '')
        if nom and nom != 'None':
            # Formato compacto de nomenclatura
            nom = ' '.join(nom.split())  # limpiar espacios multiples
        else:
            nom = ''
        return ft.Container(
            content=ft.Row([
                ft.Container(
                    content=ft.Icon(icon_for_estado(estado), color=fg_col, size=24),
                    width=44, height=44, border_radius=22,
                    bgcolor=col, alignment=ft.Alignment(0, 0),
                ),
                ft.Column([
                    ft.Row([
                        ft.Text(id_text, size=13,
                                weight=ft.FontWeight.W_600, color=C_TEXT),
                        ft.Container(expand=True),
                        ft.Text(t.get('fecha_alta', '') or '', size=10, color=C_TEXT2),
                    ]),
                    ft.Text(t.get('tipo_tramite', ''), size=12, color=C_ACCENT,
                            max_lines=1, overflow=ft.TextOverflow.ELLIPSIS),
                    ft.Row([
                        ft.Text(f"Pdo {t.get('partido','—')}", size=11, color=C_TEXT2,
                                weight=ft.FontWeight.W_500),
                        ft.Text(f"Pda {t.get('partida','—')}", size=11, color=C_TEXT2,
                                weight=ft.FontWeight.W_500),
                    ], spacing=16),
                    ft.Text(nom, size=10, color=C_GREY,
                            max_lines=1, overflow=ft.TextOverflow.ELLIPSIS,
                            visible=bool(nom)),
                ], spacing=2, expand=True),
                ft.Container(
                    content=ft.Text(estado or "—", size=10, weight=ft.FontWeight.W_800,
                                    color=fg_col, text_align=ft.TextAlign.CENTER),
                    bgcolor=col, border_radius=8,
                    padding=ft.Padding(8, 6, 8, 6), width=120,
                ),
            ], alignment=ft.MainAxisAlignment.START, spacing=10,
               vertical_alignment=ft.CrossAxisAlignment.START),
            bgcolor=C_CARD, border_radius=12,
            padding=ft.Padding(12, 10, 12, 10),
            border=Border.only(left=BorderSide(4, col)),
            margin=ft.Margin(0, 0, 0, 4),
            on_click=lambda e: show_detalle(t),
            ink=True,
        )

    # ─── Widgets ───
    tramite_list = ft.ListView(spacing=2, expand=True,
                               padding=ft.Padding(16, 0, 16, 0))
    count_text = ft.Text("", size=12, color=C_TEXT2)

    # Barra de búsqueda universal
    tf_search = ft.TextField(
        label="Buscar (partida, partido, nomenclatura, nro trámite...)",
        prefix_icon=ft.Icons.SEARCH_ROUNDED,
        dense=True, color=C_TEXT, bgcolor=C_SURFACE,
        border_color=C_PRIMARY + "55", text_size=13,
        on_submit=lambda e: apply_filters(),
        expand=True,
    )

    # Filtros de fecha
    tf_fecha_desde = ft.TextField(
        label="Desde", width=145, dense=True, color=C_TEXT, bgcolor=C_SURFACE,
        border_color=C_PRIMARY + "55", text_size=13,
        hint_text="AAAA-MM-DD",
        on_submit=lambda e: apply_filters(),
    )
    tf_fecha_hasta = ft.TextField(
        label="Hasta", width=145, dense=True, color=C_TEXT, bgcolor=C_SURFACE,
        border_color=C_PRIMARY + "55", text_size=13,
        hint_text="AAAA-MM-DD",
        on_submit=lambda e: apply_filters(),
    )

    # Filtros Pdo-Pda (opcionales)
    tf_filtro_partido = ft.TextField(
        label="Partido", width=100, dense=True, color=C_TEXT, bgcolor=C_SURFACE,
        border_color=C_PRIMARY + "55", text_size=13,
        on_submit=lambda e: apply_filters(),
    )
    tf_filtro_partida = ft.TextField(
        label="Partida", width=120, dense=True, color=C_TEXT, bgcolor=C_SURFACE,
        border_color=C_PRIMARY + "55", text_size=13,
        on_submit=lambda e: apply_filters(),
    )

    progress = ft.ProgressBar(visible=False, color=C_PRIMARY, bgcolor=C_SURFACE)
    status_text = ft.Text("", size=12, color=C_ACCENT)

    # ─── Login Dialog ───
    tf_cuit = ft.TextField(
        label="CUIT (sin guiones)", value=creds.get("cuit",""), width=280,
        color=C_TEXT, bgcolor=C_SURFACE, border_color=C_PRIMARY+"55",
        hint_text="Ej: 20130675949",
    )
    tf_cit = ft.TextField(
        label="Clave", value=creds.get("cit",""), width=280,
        password=True, can_reveal_password=True,
        color=C_TEXT, bgcolor=C_SURFACE, border_color=C_PRIMARY+"55",
    )
    cb_save = ft.Checkbox(
        label="Guardar credenciales", value=True,
        active_color=C_PRIMARY,
        label_style=ft.TextStyle(color=C_TEXT2, size=12),
    )
    login_status = ft.Text("", size=12)

    def do_login(e):
        cuit_v = tf_cuit.value.strip()
        cit_v = tf_cit.value.strip()
        if not cuit_v or not cit_v:
            login_status.value = "Complete CUIT y Clave"
            login_status.color = C_RED
            page.update()
            return

        login_status.value = "Verificando con ARBA..."
        login_status.color = C_ACCENT
        page.update()

        def _login():
            session, err = login_arba(cuit_v, cit_v)
            if err:
                login_status.value = f"✗ {err}"
                login_status.color = C_RED
            else:
                creds["cuit"] = cuit_v
                creds["cit"] = cit_v
                if cb_save.value:
                    save_creds(creds)
                login_status.value = "✓ Credenciales válidas"
                login_status.color = C_GREEN
                update_session_indicator(True)
            page.update()

        threading.Thread(target=_login, daemon=True).start()

    login_dlg = ft.AlertDialog(
        modal=True,
        title=ft.Text("Credenciales ARBA SIC", color=C_TEXT),
        bgcolor=C_SURFACE,
        content=ft.Column([
            ft.Text("Ingresá tu CUIT y clave del portal ARBA", size=12, color=C_TEXT2),
            tf_cuit, tf_cit, cb_save, login_status,
        ], tight=True, spacing=10, width=300),
        actions=[
            ft.TextButton("Cancelar", on_click=lambda e: close_dlg()),
            ft.FilledButton("Verificar", on_click=do_login,
                           style=ft.ButtonStyle(bgcolor=C_PRIMARY)),
        ],
    )

    def close_dlg():
        login_dlg.open = False
        page.update()

    def show_login(e):
        login_status.value = ""
        if login_dlg not in page.overlay:
            page.overlay.append(login_dlg)
        login_dlg.open = True
        page.update()

    # ─── Session Indicator ───
    session_icon = ft.Icon(ft.Icons.CIRCLE, size=8,
                           color=C_GREEN if creds.get("jsessionid") else C_RED)
    session_label = ft.Text(
        "Sesión activa" if creds.get("jsessionid") else "Sin sesión",
        size=11, color=C_TEXT2,
    )

    def update_session_indicator(connected=None):
        if connected is None:
            connected = bool(creds.get("cuit") and creds.get("cit"))
        session_icon.color = C_GREEN if connected else C_RED
        session_label.value = "Credenciales OK" if connected else "Sin sesión"

    session_indicator = ft.Container(
        content=ft.Row([session_icon, session_label], spacing=4),
    )

    # ─── Sync ───
    def do_sync(e):
        cuit_v = creds.get("cuit", "")
        cit_v = creds.get("cit", "")
        if not cuit_v or not cit_v:
            status_text.value = "⚠ Inicie sesión primero"
            status_text.color = C_AMBER
            page.update()
            return

        progress.visible = True
        status_text.value = "Conectando con ARBA SIC..."
        status_text.color = C_ACCENT
        page.update()

        def _sync():
            # Login fresco + sync en un solo paso
            session, err = login_arba(cuit_v, cit_v)
            if err:
                progress.visible = False
                status_text.value = f"✗ Login: {err}"
                status_text.color = C_RED
                page.update()
                return
            status_text.value = "Descargando trámites..."
            page.update()
            count, sync_err, novedades = sync_tramites(session)
            progress.visible = False
            if sync_err:
                status_text.value = f"✗ {sync_err}"
                status_text.color = C_RED
            else:
                status_text.value = f"✓ {count} trámites sincronizados"
                status_text.color = C_GREEN
                update_session_indicator(True)
            refresh_ui()
            page.update()
            
            if novedades:
                show_novedades(novedades)

        threading.Thread(target=_sync, daemon=True).start()

    # ─── Refresh ───
    def parse_date(date_str):
        if not date_str: return None
        try:
            # Reemplazar barras por guiones
            date_str = date_str.replace('/', '-')
            parts = date_str.split('-')
            if len(parts) == 3:
                # Asegurar ceros iniciales
                return f"{parts[0]}-{int(parts[1]):02d}-{int(parts[2]):02d}"
        except:
            pass
        return date_str

    def refresh_ui():
        search_val = tf_search.value.strip() if tf_search.value else None
        desde_val = parse_date(tf_fecha_desde.value.strip())
        hasta_val = parse_date(tf_fecha_hasta.value.strip())
        partido_val = tf_filtro_partido.value.strip() if tf_filtro_partido.value else None
        partida_val = tf_filtro_partida.value.strip() if tf_filtro_partida.value else None

        # List
        rows = get_tramites(
            search=search_val, fecha_desde=desde_val, fecha_hasta=hasta_val,
            filtro_partido=partido_val, filtro_partida=partida_val,
            offset=state["page"] * 50
        )
        tramite_list.controls = [make_tramite_card(t) for t in rows]
        
        # Pagination updates
        btn_prev.disabled = (state["page"] == 0)
        btn_next.disabled = (len(rows) < 50)
        page_text.value = f"Página {state['page'] + 1}"
        
        stats = get_stats()
        count_text.value = f"Mostrando {len(rows)} en esta página. Total en DB: {stats['total']}"

    def apply_filters(reset_page=True):
        if reset_page:
            state["page"] = 0
        refresh_ui()
        page.update()

    def next_page(e):
        state["page"] += 1
        apply_filters(reset_page=False)

    def prev_page(e):
        if state["page"] > 0:
            state["page"] -= 1
            apply_filters(reset_page=False)

    def clear_filters(e):
        tf_search.value = ""
        tf_fecha_desde.value = ""
        tf_fecha_hasta.value = ""
        tf_filtro_partido.value = ""
        tf_filtro_partida.value = ""
        apply_filters(reset_page=True)

    # ─── Build Page ───
    appbar = ft.AppBar(
        leading=ft.Icon(ft.Icons.MAP_ROUNDED, color=C_PRIMARY),
        title=ft.Text("AgrimensAPP", weight=ft.FontWeight.BOLD, size=18, color=C_TEXT),
        bgcolor=C_SURFACE,
        actions=[
            session_indicator,
            ft.IconButton(ft.Icons.LOGIN_ROUNDED, icon_color=C_ACCENT,
                         tooltip="Iniciar Sesión", on_click=show_login),
        ],
    )

    filter_section = ft.Container(
        content=ft.Column([
            # Barra de búsqueda
            ft.Row([tf_search], spacing=8),
            # Filtros: Fecha + Pdo/Pda
            ft.Row([
                ft.Text("Fecha:", size=12, color=C_TEXT2, weight=ft.FontWeight.W_500),
                tf_fecha_desde, tf_fecha_hasta,
                ft.VerticalDivider(width=1, color=C_GREY + "33"),
                ft.Text("Pdo-Pda:", size=12, color=C_TEXT2, weight=ft.FontWeight.W_500),
                tf_filtro_partido, tf_filtro_partida,
                ft.IconButton(ft.Icons.SEARCH_ROUNDED, icon_color=C_PRIMARY,
                             tooltip="Aplicar filtros", on_click=lambda e: apply_filters(),
                             icon_size=20),
                ft.IconButton(ft.Icons.CLEAR_ALL_ROUNDED, icon_color=C_TEXT2,
                             tooltip="Limpiar filtros", on_click=clear_filters,
                             icon_size=20),
            ], spacing=8, vertical_alignment=ft.CrossAxisAlignment.CENTER, wrap=True),
            # Contador
            ft.Row([count_text], alignment=ft.MainAxisAlignment.END),
        ], spacing=6),
        padding=ft.Padding(16, 10, 16, 6), bgcolor=C_SURFACE,
        border_radius=12, margin=ft.Margin(16, 0, 16, 6),
    )

    fab = ft.FloatingActionButton(
        icon=ft.Icons.SYNC_ROUNDED,
        bgcolor=C_PRIMARY, foreground_color=C_BG,
        tooltip="Sincronizar",
        on_click=do_sync,
    )

    page.appbar = appbar
    page.floating_action_button = fab

    # Pagination row
    btn_prev = ft.IconButton(ft.Icons.CHEVRON_LEFT_ROUNDED, on_click=prev_page, icon_color=C_PRIMARY)
    btn_next = ft.IconButton(ft.Icons.CHEVRON_RIGHT_ROUNDED, on_click=next_page, icon_color=C_PRIMARY)
    page_text = ft.Text("Página 1", color=C_TEXT2, size=12, weight=ft.FontWeight.W_600)
    
    pagination_row = ft.Row([btn_prev, page_text, btn_next], alignment=ft.MainAxisAlignment.CENTER, spacing=20)

    page.add(
        progress,
        ft.Container(
            content=ft.Row([status_text], alignment=ft.MainAxisAlignment.CENTER),
            padding=ft.Padding(0, 4, 0, 4),
        ),
        filter_section,
        ft.Container(
            content=tramite_list, expand=True,
            padding=ft.Padding(16, 0, 16, 8),
        ),
        ft.Container(content=pagination_row, padding=ft.Padding(0, 0, 0, 16)),
    )

    refresh_ui()
    page.update()

# ─── Entry ───
if __name__ == "__main__":
    init_db()
    ft.app(target=main)
