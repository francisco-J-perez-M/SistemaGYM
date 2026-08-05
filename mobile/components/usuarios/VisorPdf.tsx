/**
 * VisorPdf — renderiza un PDF dentro de la aplicación.
 *
 * Por qué así: Android no sabe dibujar un PDF en un WebView (iOS sí), y los
 * visores nativos como react-native-pdf traen dependencias pesadas. La solución
 * que funciona igual en ambas plataformas es cargar PDF.js dentro del WebView y
 * pintar cada página en un canvas.
 *
 * El documento llega como data URL desde la API. Se le pasa a PDF.js ya
 * decodificado, así que no hace falta escribir nada en el disco.
 *
 * Si el módulo del WebView no está en el build instalado, el componente avisa
 * y deja que la pantalla ofrezca la descarga como alternativa.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useColors, useFontScale } from '../../hooks/useColors';

let WebView: any = null;
try { WebView = require('react-native-webview').WebView; } catch { /* sin módulo */ }

export const HAY_VISOR_PDF = !!WebView;

interface Props {
  /** PDF en data URL. */
  dataUrl: string;
  /** Alto del área de lectura. */
  alto?: number;
}

/**
 * Documento HTML que renderiza el PDF.
 *
 * PDF.js se carga desde cdnjs, el mismo origen que ya usa el resto del
 * proyecto. Se pinta cada página a un canvas con el ancho de la pantalla y se
 * apilan verticalmente, de modo que el desplazamiento normal recorre el
 * documento entero.
 */
function construirHtml(base64: string, fondo: string, texto: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=3" />
  <style>
    html, body { margin: 0; padding: 0; background: ${fondo}; }
    #paginas { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 8px; }
    canvas { width: 100%; height: auto; border-radius: 6px; background: #fff; }
    #aviso { color: ${texto}; font-family: -apple-system, Roboto, sans-serif;
             font-size: 14px; text-align: center; padding: 28px 18px; }
  </style>
</head>
<body>
  <div id="paginas"></div>
  <div id="aviso"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script>
    const aviso = document.getElementById('aviso');

    function fallo(mensaje) {
      aviso.textContent = mensaje;
      // Se informa al lado nativo para que pueda ofrecer la descarga.
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ error: mensaje }));
      }
    }

    if (!window.pdfjsLib) {
      fallo('No se pudo cargar el visor. Revisa tu conexión.');
    } else {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      // atob convierte el base64 a binario; PDF.js espera bytes.
      const binario = atob('${base64}');
      const bytes = new Uint8Array(binario.length);
      for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);

      pdfjsLib.getDocument({ data: bytes }).promise.then(async (pdf) => {
        const contenedor = document.getElementById('paginas');
        for (let n = 1; n <= pdf.numPages; n++) {
          const pagina = await pdf.getPage(n);
          // Escala 2x para que el texto no se vea borroso en pantallas densas.
          const vista = pagina.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          canvas.width = vista.width;
          canvas.height = vista.height;
          contenedor.appendChild(canvas);
          await pagina.render({ canvasContext: canvas.getContext('2d'), viewport: vista }).promise;
        }
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ listo: true, paginas: pdf.numPages }));
        }
      }).catch(() => fallo('No se pudo mostrar este documento.'));
    }
  </script>
</body>
</html>`;
}

export default function VisorPdf({ dataUrl, alto = 460 }: Props) {
  const colors = useColors();
  const fs     = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);

  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const base64 = useMemo(
    () => (dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl),
    [dataUrl],
  );

  const html = useMemo(
    () => construirHtml(base64, colors.surface, colors.textSecondary),
    [base64, colors.surface, colors.textSecondary],
  );

  if (!WebView) {
    return (
      <View style={[styles.caja, { height: alto }]}>
        <Text style={styles.aviso}>
          Para ver documentos dentro de la aplicación necesitas una versión más
          reciente. Puedes descargarlo mientras tanto.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.caja, { height: alto }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        scrollEnabled
        javaScriptEnabled
        domStorageEnabled
        onLoadEnd={() => setCargando(false)}
        onMessage={(e: any) => {
          try {
            const datos = JSON.parse(e.nativeEvent.data);
            if (datos?.error) setError(datos.error);
          } catch { /* mensaje no esperado */ }
        }}
        accessibilityLabel="Documento del certificado"
      />

      {cargando && !error ? (
        <View style={styles.capa}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.avisoChico}>Abriendo documento…</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.capa}>
          <Text style={styles.aviso}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    caja: {
      borderRadius: 14, overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: 1, borderColor: colors.border,
    },
    web:  { flex: 1, backgroundColor: colors.surface },
    // La capa de carga se estira sobre el WebView. `absoluteFillObject` no está
    // en los tipos de esta versión de RN, así que se escriben las cuatro
    // posiciones, que es exactamente lo que aquel atajo produce.
    capa: {
      position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
      alignItems: 'center', justifyContent: 'center', gap: 10,
      backgroundColor: colors.surface,
    },
    aviso:      { color: colors.textSecondary, fontSize: 13 * fs,
                  textAlign: 'center', paddingHorizontal: 24, lineHeight: 19 },
    avisoChico: { color: colors.textMuted, fontSize: 12 * fs },
  });
}
