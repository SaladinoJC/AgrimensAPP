import React, { useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface ArbaWebViewProps {
  cuit: string;
  cit: string;
  rango?: { desde: string; hasta: string };
  onSyncComplete: (html: string, error?: string) => void;
}

// GENERADORES DE SCRIPTS 

const getScriptAlertas = () => `
  window.alert = function(mensaje) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: mensaje }));
  };
  true;
`;

const getScriptLogin = (cuit: string, cit: string) => `
  try {
    const cuitInput = document.querySelector('input[name="username"]') || document.querySelector('input[name="CUIT"]');
    const citInput = document.querySelector('input[name="password"]') || document.querySelector('input[name="clave_Cuit"]');
    const cuitExtra = document.querySelector('input[name="CUIT"]');
    const citExtra = document.querySelector('input[name="clave_Cuit"]');

    if (cuitInput && citInput) {
      cuitInput.value = '${cuit}';
      citInput.value = '${cit}';
      if (cuitExtra) cuitExtra.value = '${cuit}';
      if (citExtra) citExtra.value = '${cit}';
      
      const btn = document.querySelector('input[type="submit"], button[type="submit"], input[name="submit"], input[value="INGRESAR"]');
      if (btn) btn.click();
      else document.forms[0].submit();
    } else {
      window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ERROR', message: 'No encontré los campos de usuario y contraseña en ARBA.'}));
    }
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ERROR', message: e.toString()}));
  }
  true;
`;

const getScriptRedireccionFechas = () => `
  window.location.href = 'https://www16.arba.gov.ar/DSISIC/jsp/consultas/consultaFechas.jsp?metodo=porFechaPdoPdaJson'; 
  true;
`;

const getScriptFetchDatos = (desde: string, hasta: string) => `
  const formData = new FormData();
  formData.append('opcion', 'FEC');
  formData.append('metodo', 'porFechaPdoPdaJson');
  formData.append('tipoBusqueda', 'FEC');
  formData.append('fechaDesde', '${desde}');
  formData.append('fechaHasta', '${hasta}');

  fetch('https://www16.arba.gov.ar/DSISIC/PorFechaJson.do', {
    method: 'POST',
    body: new URLSearchParams(formData)
  })
  .then(response => response.arrayBuffer())
  .then(buffer => {
    const html = new TextDecoder('iso-8859-1').decode(buffer);
    window.ReactNativeWebView.postMessage(JSON.stringify({type: 'SUCCESS', html}));
  })
  .catch(err => {
    window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ERROR', message: err.toString()}));
  });
  true;
`;


//  COMPONENTE PRINCIPAL

export const ArbaWebView: React.FC<ArbaWebViewProps> = ({ cuit, cit, rango, onSyncComplete }) => {
  const webviewRef = useRef<WebView>(null);
  const [step, setStep] = useState(1);

  // Helper para las fechas
  const getFechasStr = () => {
    const today = new Date();
    const yearAgo = new Date();
    yearAgo.setFullYear(today.getFullYear() - 1);
    return {
      strHasta: rango?.hasta || today.toISOString().split('T')[0],
      strDesde: rango?.desde || yearAgo.toISOString().split('T')[0]
    };
  };

  // Funciones de Ejecución por Pasos 
  
  const ejecutarPasoLogin = () => {
    webviewRef.current?.injectJavaScript(getScriptLogin(cuit, cit));
    setStep(2);
  };

  const ejecutarPasoRedireccion = () => {
    webviewRef.current?.injectJavaScript(getScriptRedireccionFechas());
    setStep(3);
  };

  const ejecutarPasoExtraccion = () => {
    const { strDesde, strHasta } = getFechasStr();
    webviewRef.current?.injectJavaScript(getScriptFetchDatos(strDesde, strHasta));
    setStep(4);
  };

  const manejarErrorLogin = () => {
    setStep(99); 
    window.setTimeout(() => {
      onSyncComplete("", "Credenciales incorrectas o sesión expirada");
    }, 500);
  };

  // Manejador Principal de Navegación (Router) 

  const handleNavigationStateChange = (navState: any) => {
    const { url, loading } = navState;
    if (loading) return; 

    console.log(`[WebView] Step: ${step} | URL: ${url}`);
    const urlLower = url.toLowerCase();

    // Ruteo lógico de pasos
    if (step === 1 && urlLower.includes('sso.arba.gov.ar/login')) {
      ejecutarPasoLogin();
    } 
    else if ((step === 1 || step === 2) && (url.includes('DSISIC/home.do') || url.includes('DSISIC/asignarRol.do') || url.includes('DSISIC/login.do'))) {
      ejecutarPasoRedireccion();
    }
    else if (step === 3 && url.includes('consultaFechas.jsp')) {
      ejecutarPasoExtraccion();
    }
    else if (step === 2 && urlLower.includes('sso.arba.gov.ar/login')) {
      manejarErrorLogin();
    }
  };

  // Manejador de Respuestas del Script 

  const handleMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'SUCCESS') {
        onSyncComplete(String(msg.html || ""));
      } else {
        onSyncComplete("", msg.message);
      }
    } catch (e) {
      onSyncComplete("", "Error parseando respuesta del WebView");
    }
  };

  // Renderizado del WebView (oculto) 

  return (
    <View style={styles.hiddenContainer}>
      <WebView
        ref={webviewRef}
        source={{ uri: 'https://www16.arba.gov.ar/DSISIC/' }}
        sharedCookiesEnabled={false}
        incognito={true}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        injectedJavaScript={getScriptAlertas()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  hiddenContainer: {
    height: 0,
    width: 0,
    opacity: 0,
    position: 'absolute',
  }
});