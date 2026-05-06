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
        fecha_movimiento TEXT, ultima_sincronizacion TEXT
    )""")
    conn.commit()
    conn.close()

def upsert_tramites(rows):
    conn = sqlite3.connect(DB_PATH)
    for r in rows:
        conn.execute("""INSERT OR REPLACE INTO tramites
            (nroExpediente, partido, partida, estado, fecha_movimiento, ultima_sincronizacion)
            VALUES (?,?,?,?,?,?)""",
            (r.get("nroExpediente",""), r.get("partido",""), r.get("partida",""),
             r.get("estado",""), r.get("fechaMovimiento",""),
             datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
    conn.commit()
    conn.close()

def get_tramites(filtro_partido=None, filtro_partida=None, filtro_estado=None, ocultar_en_curso=True):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    q = "SELECT * FROM tramites WHERE 1=1"
    params = []
    if ocultar_en_curso:
        q += " AND UPPER(estado) NOT IN ('EN CURSO','EN TRAMITE')"
    if filtro_partido:
        q += " AND partido=?"
        params.append(filtro_partido)
    if filtro_partida:
        q += " AND partida LIKE ?"
        params.append(f"%{filtro_partida}%")
    if filtro_estado:
        q += " AND UPPER(estado)=?"
        params.append(filtro_estado.upper())
    q += " ORDER BY fecha_movimiento DESC"
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
    obs = conn.execute("SELECT COUNT(*) FROM tramites WHERE UPPER(estado) LIKE '%OBSERV%'").fetchone()[0]
    apr = conn.execute("SELECT COUNT(*) FROM tramites WHERE UPPER(estado) LIKE '%APROB%' OR UPPER(estado) LIKE '%REGISTR%'").fetchone()[0]
    enc = conn.execute("SELECT COUNT(*) FROM tramites WHERE UPPER(estado) IN ('EN CURSO','EN TRAMITE')").fetchone()[0]
    conn.close()
    return {"total": total, "observados": obs, "aprobados": apr, "en_curso": enc}

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
def login_arba(cuit, cit):
    """Intenta login directo al SIC y devuelve JSESSIONID."""
    s = requests.Session()
    try:
        s.get("https://www16.arba.gov.ar/DSISIC/", verify=False, timeout=15)
        resp = s.post("https://www16.arba.gov.ar/DSISIC/login.do",
            data={"cuit": cuit, "cit": cit, "submit": "Ingresar"},
            verify=False, timeout=15, allow_redirects=True)
        jsid = s.cookies.get("JSESSIONID", "")
        if jsid:
            return jsid, None
        for c in s.cookies:
            if "SESSION" in c.name.upper():
                return c.value, None
        return "", "No se obtuvo cookie de sesión. Verifique credenciales."
    except Exception as e:
        return "", f"Error de conexión: {str(e)}"

def sync_tramites(jsessionid):
    """Sincroniza trámites desde SIC ARBA."""
    hoy = datetime.now()
    desde = (hoy - timedelta(days=60)).strftime("%d/%m/%Y")
    hasta = hoy.strftime("%d/%m/%Y")
    logging.info(f"Sync iniciado: desde={desde}, hasta={hasta}")
    try:
        resp = requests.post(
            "http://www16.arba.gov.ar/DSISIC/PorFechaJson.do",
            data={
                "opcion": "FEC", "metodo": "porFechaPdoPdaJson",
                "tipoBusqueda": "FEC", "fechaDesde": desde, "fechaHasta": hasta
            },
            cookies={"JSESSIONID": jsessionid},
            headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"},
            verify=False, timeout=30
        )
        logging.info(f"Respuesta HTTP {resp.status_code}")
        logging.debug(f"Headers: {dict(resp.headers)}")
        # Log primeros 2000 chars de la respuesta para debug
        logging.debug(f"Body (preview): {resp.text[:2000]}")
        if resp.status_code == 200:
            data = resp.json()
            logging.info(f"JSON type={type(data).__name__}, keys={list(data.keys()) if isinstance(data, dict) else 'list'}")
            rows = []
            if isinstance(data, list):
                rows = data
            elif isinstance(data, dict):
                for key in ["tramites", "rows", "data", "resultado", "expedientes"]:
                    if key in data and isinstance(data[key], list):
                        rows = data[key]
                        logging.info(f"Datos encontrados en key='{key}', count={len(rows)}")
                        break
                if not rows and "nroExpediente" in data:
                    rows = [data]
            if rows:
                if rows:
                    logging.info(f"Primer registro keys: {list(rows[0].keys())}")
                upsert_tramites(rows)
                return len(rows), None
            return 0, "Respuesta sin trámites. ¿Sesión expirada?"
        elif resp.status_code in (401, 403, 302):
            return 0, "Sesión expirada. Vuelva a iniciar sesión."
        else:
            return 0, f"Error HTTP {resp.status_code}"
    except requests.exceptions.ConnectionError:
        logging.error("ConnectionError al SIC")
        return 0, "No se pudo conectar al SIC. ¿Está disponible?"
    except json.JSONDecodeError as e:
        logging.error(f"JSONDecodeError: {e}")
        return 0, "Respuesta inválida del SIC. Sesión posiblemente expirada."
    except Exception as e:
        logging.error(f"Exception en sync: {e}", exc_info=True)
        return 0, f"Error: {str(e)}"

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
    ocultar_en_curso = True

    # ─── Helpers ───
    def color_for_estado(estado):
        e = (estado or "").upper()
        if "OBSERV" in e: return C_RED
        if "APROB" in e or "REGISTR" in e: return C_GREEN
        if "EN CURSO" in e or "EN TRAMITE" in e: return C_AMBER
        return C_GREY

    def icon_for_estado(estado):
        e = (estado or "").upper()
        if "OBSERV" in e: return ft.Icons.WARNING_ROUNDED
        if "APROB" in e or "REGISTR" in e: return ft.Icons.CHECK_CIRCLE_ROUNDED
        if "EN CURSO" in e or "EN TRAMITE" in e: return ft.Icons.HOURGLASS_TOP_ROUNDED
        return ft.Icons.DESCRIPTION_ROUNDED

    def make_stat_card(title, value, color, icon):
        return ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Icon(icon, color=color, size=22),
                    ft.Text(str(value), size=28, weight=ft.FontWeight.BOLD, color=color),
                ], alignment=ft.MainAxisAlignment.CENTER),
                ft.Text(title, size=11, color=C_TEXT2, text_align=ft.TextAlign.CENTER),
            ], horizontal_alignment=ft.CrossAxisAlignment.CENTER, spacing=4),
            bgcolor=C_CARD, border_radius=12,
            padding=ft.Padding(16, 16, 16, 16), expand=True,
            border=Border.all(1, color + "33"),
        )

    def make_tramite_card(t):
        estado = t.get("estado", "")
        col = color_for_estado(estado)
        return ft.Container(
            content=ft.Row([
                ft.Container(
                    content=ft.Icon(icon_for_estado(estado), color=col, size=28),
                    width=48, height=48, border_radius=24,
                    bgcolor=col + "1A", alignment=ft.Alignment(0, 0),
                ),
                ft.Column([
                    ft.Text(f"Exp: {t.get('nroExpediente','—')}", size=14,
                            weight=ft.FontWeight.W_600, color=C_TEXT),
                    ft.Row([
                        ft.Text(f"Pdo: {t.get('partido','—')}", size=11, color=C_TEXT2),
                        ft.Text(f"Pda: {t.get('partida','—')}", size=11, color=C_TEXT2),
                    ], spacing=12),
                    ft.Text(f"Mov: {t.get('fecha_movimiento','—')}", size=10, color=C_TEXT2),
                ], spacing=2, expand=True),
                ft.Container(
                    content=ft.Text(estado or "—", size=10, weight=ft.FontWeight.BOLD,
                                    color=col, text_align=ft.TextAlign.CENTER),
                    bgcolor=col + "1A", border_radius=8,
                    padding=ft.Padding(8, 4, 8, 4),
                ),
            ], alignment=ft.MainAxisAlignment.START, spacing=12),
            bgcolor=C_CARD, border_radius=12,
            padding=ft.Padding(14, 14, 14, 14),
            border=Border.only(left=BorderSide(3, col)),
            margin=ft.Margin(0, 0, 0, 6),
        )

    # ─── Widgets ───
    tramite_list = ft.ListView(spacing=4, expand=True,
                               padding=ft.Padding(16, 0, 16, 0))
    stat_row = ft.Row(spacing=10)
    count_text = ft.Text("", size=12, color=C_TEXT2)

    dd_partido = ft.Dropdown(
        label="Partido", width=180, dense=True, color=C_TEXT, bgcolor=C_SURFACE,
        border_color=C_PRIMARY + "55", text_size=13,
        on_select=lambda e: apply_filters(),
        options=[],
    )
    dd_estado = ft.Dropdown(
        label="Estado", width=180, dense=True, color=C_TEXT, bgcolor=C_SURFACE,
        border_color=C_PRIMARY + "55", text_size=13,
        on_select=lambda e: apply_filters(),
        options=[],
    )
    tf_partida = ft.TextField(
        label="Partida", width=150, dense=True, color=C_TEXT, bgcolor=C_SURFACE,
        border_color=C_PRIMARY + "55", text_size=13,
        on_submit=lambda e: apply_filters(),
    )
    sw_ocultar = ft.Switch(
        label="Ocultar En Curso/Tramite", value=True,
        active_color=C_PRIMARY,
        label_text_style=ft.TextStyle(size=12, color=C_TEXT2),
        on_change=lambda e: apply_filters(),
    )

    progress = ft.ProgressBar(visible=False, color=C_PRIMARY, bgcolor=C_SURFACE)
    status_text = ft.Text("", size=12, color=C_ACCENT)

    # ─── Login Dialog ───
    tf_cuit = ft.TextField(
        label="CUIT", value=creds.get("cuit",""), width=280,
        color=C_TEXT, bgcolor=C_SURFACE, border_color=C_PRIMARY+"55",
    )
    tf_cit = ft.TextField(
        label="CIT (Clave)", value=creds.get("cit",""), width=280,
        password=True, can_reveal_password=True,
        color=C_TEXT, bgcolor=C_SURFACE, border_color=C_PRIMARY+"55",
    )
    tf_jsessionid = ft.TextField(
        label="JSESSIONID (manual)", value=creds.get("jsessionid",""),
        width=280, color=C_TEXT, bgcolor=C_SURFACE,
        border_color=C_PRIMARY+"55", text_size=12,
        hint_text="Opcional: pegar cookie manual",
    )
    cb_save = ft.Checkbox(
        label="Guardar credenciales", value=True,
        active_color=C_PRIMARY,
        label_style=ft.TextStyle(color=C_TEXT2, size=12),
    )
    login_status = ft.Text("", size=12)

    def do_login(e):
        login_status.value = "Conectando..."
        login_status.color = C_ACCENT
        page.update()

        def _login():
            cuit_v = tf_cuit.value.strip()
            cit_v = tf_cit.value.strip()
            manual_js = tf_jsessionid.value.strip()

            if manual_js:
                creds["jsessionid"] = manual_js
                creds["cuit"] = cuit_v
                creds["cit"] = cit_v
                if cb_save.value:
                    save_creds(creds)
                login_status.value = "✓ JSESSIONID manual guardado"
                login_status.color = C_GREEN
                update_session_indicator()
                page.update()
                return

            if not cuit_v or not cit_v:
                login_status.value = "Complete CUIT y CIT"
                login_status.color = C_RED
                page.update()
                return

            jsid, err = login_arba(cuit_v, cit_v)
            if err:
                login_status.value = f"✗ {err}"
                login_status.color = C_RED
            else:
                creds["jsessionid"] = jsid
                creds["cuit"] = cuit_v
                creds["cit"] = cit_v
                tf_jsessionid.value = jsid
                if cb_save.value:
                    save_creds(creds)
                login_status.value = "✓ Sesión obtenida"
                login_status.color = C_GREEN
                update_session_indicator()
            page.update()

        threading.Thread(target=_login, daemon=True).start()

    login_dlg = ft.AlertDialog(
        modal=True,
        title=ft.Text("Iniciar Sesión en ARBA", color=C_TEXT),
        bgcolor=C_SURFACE,
        content=ft.Column([
            ft.Text("Ingrese sus credenciales del SIC", size=12, color=C_TEXT2),
            tf_cuit, tf_cit,
            ft.Divider(color=C_GREY+"33"),
            ft.Text("O ingrese la cookie de sesión manualmente:", size=11, color=C_TEXT2),
            tf_jsessionid, cb_save, login_status,
        ], tight=True, spacing=10, width=300),
        actions=[
            ft.TextButton("Cancelar", on_click=lambda e: close_dlg()),
            ft.FilledButton("Conectar", on_click=do_login,
                           style=ft.ButtonStyle(bgcolor=C_PRIMARY)),
        ],
    )

    def close_dlg():
        login_dlg.open = False
        page.update()

    def show_login(e):
        login_status.value = ""
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

    def update_session_indicator():
        has_session = bool(creds.get("jsessionid"))
        session_icon.color = C_GREEN if has_session else C_RED
        session_label.value = "Sesión activa" if has_session else "Sin sesión"

    session_indicator = ft.Container(
        content=ft.Row([session_icon, session_label], spacing=4),
    )

    # ─── Sync ───
    def do_sync(e):
        jsid = creds.get("jsessionid", "")
        if not jsid:
            status_text.value = "⚠ Inicie sesión primero"
            status_text.color = C_AMBER
            page.update()
            return

        progress.visible = True
        status_text.value = "Sincronizando con SIC..."
        status_text.color = C_ACCENT
        page.update()

        def _sync():
            count, err = sync_tramites(jsid)
            progress.visible = False
            if err:
                status_text.value = f"✗ {err}"
                status_text.color = C_RED
            else:
                status_text.value = f"✓ {count} trámites sincronizados"
                status_text.color = C_GREEN
            refresh_ui()
            page.update()

        threading.Thread(target=_sync, daemon=True).start()

    # ─── Refresh ───
    def refresh_ui():
        filtro_partido_val = dd_partido.value if dd_partido.value else None
        filtro_estado_val = dd_estado.value if dd_estado.value else None
        filtro_partida_val = tf_partida.value.strip() if tf_partida.value else None
        oc = sw_ocultar.value

        # Stats
        stats = get_stats()
        stat_row.controls = [
            make_stat_card("Total", stats["total"], C_ACCENT, ft.Icons.FOLDER_ROUNDED),
            make_stat_card("Observados", stats["observados"], C_RED, ft.Icons.WARNING_ROUNDED),
            make_stat_card("Aprobados", stats["aprobados"], C_GREEN, ft.Icons.CHECK_CIRCLE_ROUNDED),
            make_stat_card("En Curso", stats["en_curso"], C_AMBER, ft.Icons.HOURGLASS_TOP_ROUNDED),
        ]

        # Dropdowns
        partidos = get_unique_col("partido")
        estados = get_unique_col("estado")
        dd_partido.options = [ft.DropdownOption(key="", text="— Todos —")] + \
                             [ft.DropdownOption(key=p, text=p) for p in partidos]
        dd_estado.options = [ft.DropdownOption(key="", text="— Todos —")] + \
                            [ft.DropdownOption(key=es, text=es) for es in estados]

        # List
        rows = get_tramites(filtro_partido_val, filtro_partida_val, filtro_estado_val, oc)
        tramite_list.controls = [make_tramite_card(t) for t in rows]
        count_text.value = f"Mostrando {len(rows)} trámite(s)"

    def apply_filters():
        refresh_ui()
        page.update()

    def clear_filters(e):
        dd_partido.value = None
        dd_estado.value = None
        tf_partida.value = ""
        sw_ocultar.value = True
        apply_filters()

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
            ft.Row([
                dd_partido, tf_partida, dd_estado,
                ft.IconButton(ft.Icons.CLEAR_ALL_ROUNDED, icon_color=C_TEXT2,
                             tooltip="Limpiar filtros", on_click=clear_filters),
            ], spacing=10, wrap=True),
            ft.Row([sw_ocultar, ft.Container(expand=True), count_text], spacing=10),
        ], spacing=8),
        padding=ft.Padding(16, 10, 16, 10), bgcolor=C_SURFACE,
        border_radius=12, margin=ft.Margin(16, 0, 16, 8),
    )

    fab = ft.FloatingActionButton(
        icon=ft.Icons.SYNC_ROUNDED,
        bgcolor=C_PRIMARY, foreground_color=C_BG,
        tooltip="Sincronizar",
        on_click=do_sync,
    )

    page.appbar = appbar
    page.floating_action_button = fab

    page.add(
        progress,
        ft.Container(
            content=ft.Row([status_text], alignment=ft.MainAxisAlignment.CENTER),
            padding=ft.Padding(0, 4, 0, 4),
        ),
        ft.Container(content=stat_row, padding=ft.Padding(16, 8, 16, 8)),
        filter_section,
        ft.Container(
            content=tramite_list, expand=True,
            padding=ft.Padding(16, 0, 16, 16),
        ),
    )

    refresh_ui()
    page.update()

# ─── Entry ───
if __name__ == "__main__":
    init_db()
    ft.app(target=main)  # Cambiar a ft.run(main) en Flet >= 0.85
