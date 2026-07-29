/**
 * components/BotonesPago.tsx — Botones de pago en línea para la app móvil.
 *
 * Consulta los métodos que el gimnasio tiene activos (PayPal / Mercado Pago) y,
 * al pulsar uno, abre el checkout en el navegador seguro del sistema. Al volver,
 * confirma el estado real del pago y avisa al usuario.
 *
 * Uso:
 *   <BotonesPago contexto="membresia" monto={499}
 *                descripcion="Membresía mensual"
 *                referenciaLocal={idMiembro}
 *                onPagado={(tx) => recargarPantalla()} />
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import {
  getMetodosPago, pagarEnApp, mensajePorEstado,
  MetodoPago, ProveedorPago, ContextoPago, TransaccionPago,
} from '../services/pagos';
import { useColors, useFontScale } from '../hooks/useColors';

/**
 * EXCEPCIÓN DELIBERADA AL SISTEMA DE COLOR.
 *
 * Estos HEX pertenecen a la identidad de PayPal y Mercado Pago, no a GymPro:
 * sus guías de marca exigen el amarillo y el celeste exactos para que el
 * usuario reconozca el botón. Por eso NO se mueven al cambiar de paleta y
 * NO deben migrarse a tokens. Todo lo demás del componente sí usa la paleta.
 */
const MARCAS: Record<string, { bg: string; fg: string }> = {
  paypal:      { bg: '#FFC439', fg: '#111827' },
  mercadopago: { bg: '#00B1EA', fg: '#FFFFFF' },
};

interface Props {
  contexto: ContextoPago;
  monto: number;
  descripcion?: string;
  referenciaLocal?: string | number | null;
  emailPagador?: string | null;
  deshabilitado?: boolean;
  onPagado?: (tx?: TransaccionPago) => void;
}

export default function BotonesPago({
  contexto, monto, descripcion, referenciaLocal, emailPagador,
  deshabilitado = false, onPagado,
}: Props) {
  const colors = useColors();
  const fs     = useFontScale();
  const styles = React.useMemo(() => make_styles(colors, fs), [colors, fs]);

  const [metodos, setMetodos]       = useState<MetodoPago[]>([]);
  const [cargando, setCargando]     = useState(true);
  const [procesando, setProcesando] = useState<ProveedorPago | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const lista = await getMetodosPago();
        if (vivo) setMetodos(lista);
      } catch {
        if (vivo) setMetodos([]);
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    return () => { vivo = false; };
  }, []);

  const pagar = async (proveedor: ProveedorPago) => {
    if (!monto || monto <= 0) {
      Alert.alert('Monto inválido', 'El importe debe ser mayor que cero.');
      return;
    }
    setProcesando(proveedor);
    try {
      const res = await pagarEnApp({
        proveedor, contexto, monto,
        descripcion, referenciaLocal, emailPagador,
      });
      const info = mensajePorEstado(res.estado);
      Alert.alert(info.titulo, res.mensaje ?? info.texto);
      if (res.estado === 'aprobado' || res.estado === 'pendiente') {
        onPagado?.(res.transaccion);
      }
    } catch (e: any) {
      Alert.alert(
        'No se pudo iniciar el pago',
        e?.response?.data?.msg ?? 'Intenta de nuevo más tarde.',
      );
    } finally {
      setProcesando(null);
    }
  };

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.tenue}>Cargando métodos de pago…</Text>
      </View>
    );
  }

  if (metodos.length === 0) {
    return (
      <View style={styles.aviso}>
        <Text style={styles.avisoTexto}>
          Este gimnasio aún no tiene activados los pagos en línea.
          Puedes pagar directamente en recepción.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      {metodos.map((m) => {
        // Sin marca conocida, el botón cae al acento del producto.
        const c = MARCAS[m.proveedor] ?? { bg: colors.accent, fg: colors.onAccent };
        const enCurso = procesando === m.proveedor;
        const bloqueado = deshabilitado || procesando !== null;
        return (
          <TouchableOpacity
            key={m.proveedor}
            onPress={() => pagar(m.proveedor)}
            disabled={bloqueado}
            activeOpacity={0.85}
            style={[
              styles.boton,
              { backgroundColor: c.bg, opacity: bloqueado && !enCurso ? 0.6 : 1 },
            ]}
          >
            {enCurso
              ? <ActivityIndicator color={c.fg} />
              : <Text style={[styles.botonTexto, { color: c.fg }]}>Pagar con {m.nombre}</Text>}
            {m.modo === 'sandbox' && !enCurso && (
              <Text style={[styles.badge, { color: c.fg }]}>PRUEBAS</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    contenedor: { gap: 10 },
    // Fondo y texto del botón vienen de MARCAS (identidad de la pasarela).
    boton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 18,
    },
    botonTexto: { fontSize: 15 * fs, fontWeight: '700' },
    // Va dentro del botón de marca: se oscurece el propio fondo de la pasarela,
    // por eso no usa un token de la paleta.
    badge: {
      fontSize: 10 * fs, fontWeight: '800',
      backgroundColor: 'rgba(0,0,0,0.15)', paddingHorizontal: 6,
      paddingVertical: 2, borderRadius: 6, overflow: 'hidden',
    },
    centro: { alignItems: 'center', gap: 8, paddingVertical: 12 },
    tenue:  { fontSize: 13 * fs, color: colors.textSecondary },
    // Aviso de "sin pagos en línea": es una advertencia -> tono atención.
    aviso: {
      backgroundColor: colors.dataAtencionBg, borderLeftWidth: 3,
      borderLeftColor: colors.dataAtencion, borderRadius: 8, padding: 12,
    },
    avisoTexto: { fontSize: 13 * fs, color: colors.text, lineHeight: 19 * fs },
  });
}
