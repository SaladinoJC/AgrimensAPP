/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

function extractJsonArrayStringFromHtml(html) {
  const htmlLower = String(html).toLowerCase();
  const seemsLoginOrSessionProblem =
    htmlLower.includes('sso.arba.gov.ar/login') ||
    htmlLower.includes('dsisic - ingreso usuario y password') ||
    htmlLower.includes('loginsso.jsp') ||
    htmlLower.includes('name="lt"') ||
    htmlLower.includes('dsisic-login') ||
    htmlLower.includes('opcioneslogin.jsp') ||
    htmlLower.includes('otro usuario ha iniciado una sesión');

  const seemsServerError =
    htmlLower.includes('fallo.jsp') ||
    htmlLower.includes('error inesperado') ||
    htmlLower.includes('ocurrió un error inesperado') ||
    htmlLower.includes('código de transacción');

  if (seemsLoginOrSessionProblem) throw new Error('CREDENCIALES_INVALIDAS');
  if (seemsServerError) throw new Error('ARBA_NO_DISPONIBLE');

  const m = String(html).match(/(\[\s*\{.*\}\s*\])/s);
  if (!m?.[1]) throw new Error('TECNICO');
  return m[1];
}

function ok(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exitCode = 1;
  }
}

function shouldThrow(kind, fn, msg) {
  try {
    fn();
    ok(false, `${msg} (esperaba ${kind})`);
  } catch (e) {
    ok(String(e && e.message) === kind, `${msg} (tiró ${e && e.message})`);
  }
}

function shouldParse(file, minLen) {
  const html = fs.readFileSync(file, 'utf8');
  const json = extractJsonArrayStringFromHtml(html);
  const arr = JSON.parse(json);
  ok(Array.isArray(arr), `${path.basename(file)} parse -> array`);
  ok(arr.length >= minLen, `${path.basename(file)} len >= ${minLen}`);
}

const repoRoot = path.join(__dirname, '..', '..');
const desktop = path.join(repoRoot, 'desktop');

// Success fixture
shouldParse(path.join(desktop, 'sic_resultados_fec.html'), 1);

// Error fixtures
shouldThrow(
  'ARBA_NO_DISPONIBLE',
  () => extractJsonArrayStringFromHtml(fs.readFileSync(path.join(desktop, 'sic_resultado.html'), 'utf8')),
  'sic_resultado.html server error'
);
shouldThrow(
  'CREDENCIALES_INVALIDAS',
  () => extractJsonArrayStringFromHtml(fs.readFileSync(path.join(desktop, 'sic_home.html'), 'utf8')),
  'sic_home.html login/options error'
);
shouldThrow(
  'TECNICO',
  () => extractJsonArrayStringFromHtml(fs.readFileSync(path.join(desktop, 'sic_consultaFechas.html'), 'utf8')),
  'sic_consultaFechas.html no-json'
);
shouldThrow(
  'CREDENCIALES_INVALIDAS',
  () => extractJsonArrayStringFromHtml(fs.readFileSync(path.join(desktop, 'respuesta_sic.html'), 'utf8')),
  'respuesta_sic.html rol/login flow'
);

if (!process.exitCode) console.log('OK: DSISIC parser fixtures');

