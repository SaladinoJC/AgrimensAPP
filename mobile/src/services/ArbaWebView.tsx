import React, { useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface ArbaWebViewProps {
  cuit: string;
  cit: string;
  rango?: { desde: string; hasta: string };
  // 1. CORRECCIÓN: Ahora espera un arreglo (rows) igual que App.tsx
  onSyncComplete: (rows: any[], error?: string) => void;
}

export const ArbaWebView: React.FC<ArbaWebViewProps> = ({ cuit, cit, rango, onSyncComplete }) => {
  const webviewRef = useRef<WebView>(null);
  const [step, setStep] = useState(1);

  const today = new Date();
  const yearAgo = new Date();
  yearAgo.setFullYear(today.getFullYear() - 1);
  const strHasta = rango?.hasta || today.toISOString().split('T')[0];
  const strDesde = rango?.desde || yearAgo.toISOString().split('T')[0];

  const handleNavigationStateChange = (navState: any) => {
    const { url, loading } = navState;
    if (loading) return; 

    console.log("WebView navigating to: ", url, " Step: ", step);

    if (step === 1 && url.toLowerCase().includes('sso.arba.gov.ar/login')) {
      // Inyectar credenciales y hacer login
      const injectLogin = `
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
            if (btn) {
               btn.click();
            } else {
               document.forms[0].submit();
            }
          } else {
            window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ERROR', message: 'No encontré los campos de usuario y contraseña en ARBA.'}));
          }
        } catch(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ERROR', message: e.toString()}));
        }
        true;
      `;
      webviewRef.current?.injectJavaScript(injectLogin);
      setStep(2);
    } 
    else if ((step === 1 || step === 2) && (url.includes('DSISIC/home.do') || url.includes('DSISIC/asignarRol.do') || url.includes('DSISIC/login.do'))) {
      // Login exitoso o sesión ya activa, ir a inicializar fechas
      webviewRef.current?.injectJavaScript(`window.location.href = 'https://www16.arba.gov.ar/DSISIC/jsp/consultas/consultaFechas.jsp?metodo=porFechaPdoPdaJson'; true;`);
      setStep(3);
    }
    else if (step === 3 && url.includes('consultaFechas.jsp')) {
      // Estamos en la pantalla de fechas, ahora hacemos un fetch directo al JSON
      const fetchScript = `
        const formData = new FormData();
        formData.append('opcion', 'FEC');
        formData.append('metodo', 'porFechaPdoPdaJson');
        formData.append('tipoBusqueda', 'FEC');
        formData.append('fechaDesde', '${strDesde}');
        formData.append('fechaHasta', '${strHasta}');

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
      webviewRef.current?.injectJavaScript(fetchScript);
      setStep(4);
    }
    else if (url.toLowerCase().includes('sso.arba.gov.ar/login') && step > 1) {
       // Si volvemos al login después del step 1, las credenciales fallaron
       if (step === 2) {
          window.setTimeout(() => {
             onSyncComplete([""], "Credenciales incorrectas o sesión expirada");
          }, 1000);
       }
    }
  };

  const handleMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'SUCCESS') {
        onSyncComplete(msg.data ? [msg.data] : [], undefined);
      } else {
        onSyncComplete([""], msg.message);
      }
    } catch (e) {
      onSyncComplete([""], "Error parseando respuesta del WebView");
    }
  };

  return (
    <View style={styles.hiddenContainer}>
      <WebView
        ref={webviewRef}
        source={{ uri: 'https://www16.arba.gov.ar/DSISIC/' }}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
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