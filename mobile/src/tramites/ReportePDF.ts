import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { TramiteDetail } from '@/types/tramites-type';
import { getStatusColor } from '@/utils/utils-tramite';


  const getHTMLTemplate = (tramite: TramiteDetail) => {
    if (!tramite) return '';
    return `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #ffffff; }
            h1 { color: #00bfa5; border-bottom: 2px solid #00bfa5; padding-bottom: 10px; }
            .detail-row { display: flex; margin: 10px 0; border-bottom: 1px solid #f0f0f0; padding-bottom: 5px; }
            .detail-label { font-weight: bold; width: 180px; color: #182136; }
            .detail-value { flex: 1; color: #0f1724; }
            .status-badge { 
              display: inline-block; 
              padding: 5px 10px; 
              border-radius: 5px; 
              background: ${getStatusColor(tramite.estado)}; 
              color: white; 
              font-weight: bold; 
            }
            .timestamp { font-size: 12px; color: #999; margin-top: 30px; text-align: right; font-style: italic; }
          </style>
        </head>
        <body>
          <h1>Detalle de Trámite</h1>
          <div class="detail-row"><div class="detail-label">Nº de Expediente:</div><div class="detail-value">${tramite.nroExpediente || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Estado:</div><div class="detail-value"><span class="status-badge">${tramite.estado || '-'}</span></div></div>
          <div class="detail-row"><div class="detail-label">Partido:</div><div class="detail-value">${tramite.partido || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Partida:</div><div class="detail-value">${tramite.partida || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Tipo de Trámite:</div><div class="detail-value">${tramite.tipo_tramite || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Nomenclatura:</div><div class="detail-value">${tramite.nomenclatura || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Fecha de Alta:</div><div class="detail-value">${tramite.fecha_alta || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Fecha del Estado:</div><div class="detail-value">${tramite.fecha_movimiento || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Origen:</div><div class="detail-value">${tramite.origen || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Oblea:</div><div class="detail-value">${tramite.oblea || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Demora:</div><div class="detail-value">${tramite.demora || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Fecha Final Estimada:</div><div class="detail-value">${tramite.final_estimada || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Última Sincronización:</div><div class="detail-value">${tramite.ultima_sincronizacion || '-'}</div></div>
          <p class="timestamp">Generado automáticamente por AgrimensAPP el: ${new Date().toLocaleString('es-AR')}</p>
        </body>
      </html>
    `;
  };

  // Abre el diálogo nativo para Ver/Guardar PDF
export const handlePrintPDF = async (tramite: TramiteDetail) => {
    try {
      await Print.printAsync({ html: getHTMLTemplate(tramite) });
    } catch (error) {
      console.error('Error viewing PDF:', error);
    }
  };

  // Genera el PDF en segundo plano y abre WhatsApp/Mail para compartir
  export const handleSharePDF = async (tramite: TramiteDetail) => {
    try {
      const { uri } = await Print.printToFileAsync({ html: getHTMLTemplate(tramite) });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir Trámite',
      });
    } catch (error) {
      Alert.alert('Ocurrió un error al generar o compartir el PDF.');
    }
  };
