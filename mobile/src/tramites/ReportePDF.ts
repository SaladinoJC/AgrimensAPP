import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

const C_RED = "#ef5350";
const C_GREEN = "#66bb6a";
const C_AMBER = "#ffca28";
const C_GREY = "#78909c";

const getColor = (estado: string) => {
  const e = (estado || "").toUpperCase();
  if (e.includes("RECHAZ")) return C_RED;
  if (e.includes("FINALIZ") || e.includes("ENTREGADO")) return C_GREEN;
  if (e.includes("EN CURSO") || e.includes("EN TRAMITE") || e.includes("PENDIENTE")) return C_AMBER;
  return C_GREY;
};

export const compartirTramitePDF = async (tramite: any) => {
  if (!tramite) return;

  const htmlContent = `
    <html>
      <body style="font-family: sans-serif; padding: 40px; color: #333;">
        <h1 style="color: #00bfa5;">AgrimensAPP - Reporte de Trámite</h1>
        <hr/>
        <h2>Expediente #${tramite.nroExpediente || '—'}</h2>
        <h3 style="color: ${getColor(tramite.estado)}">${tramite.estado || '—'}</h3>
        <p><strong>Tipo:</strong> ${tramite.tipo_tramite || '—'}</p>
        <p><strong>Partido:</strong> ${tramite.partido || '—'} | <strong>Partida:</strong> ${tramite.partida || '—'}</p>
        <p><strong>Nomenclatura:</strong> ${tramite.nomenclatura || '—'}</p>
        <p><strong>Fecha Alta:</strong> ${tramite.fecha_alta || '—'}</p>
        <p><strong>Último Movimiento:</strong> ${tramite.fecha_movimiento || '—'}</p>
        ${tramite.demora ? \`<p><strong>Demora:</strong> \${tramite.demora} días</p>\` : ''}
        <br/><br/>
        <p style="font-size: 12px; color: #888;">Generado automáticamente por AgrimensAPP Mobile</p>
      </body>
    </html>
  `;
  
  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(uri, { 
        UTI: '.pdf', 
        mimeType: 'application/pdf', 
        dialogTitle: 'Compartir Trámite' 
    });
  } catch (e) {
    Alert.alert("Error", "No se pudo compartir el reporte PDF.");
  }
};
