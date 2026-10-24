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

const COLORES: Record<string, { bg: string; fg: string }> = {
  paypal:      { bg: '#ffc439', fg: '#111827' },
  mercadopago: { bg: '#00b1ea', fg: '#ffffff' },
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
        <ActivityIndicator />
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
        const c = COLORES[m.proveedor] ?? { bg: '#2563eb', fg: '#ffffff' };
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
              <Text style={styles.badge}>PRUEBAS</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: 10 },
  boton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 18,
  },
  botonTexto: { fontSize: 15, fontWeight: '700' },
  badge: {
    fontSize: 10, fontWeight: '800', color: '#111827',
    backgroundColor: 'rgba(0,0,0,0.15)', paddingHorizontal: 6,
    paddingVertical: 2, borderRadius: 6, overflow: 'hidden',
  },
  centro: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  tenue: { fontSize: 13, color: '#6b7280' },
  aviso: {
    backgroundColor: 'rgba(234,179,8,0.12)', borderLeftWidth: 3,
    borderLeftColor: '#eab308', borderRadius: 8, padding: 12,
  },
  avisoTexto: { fontSize: 13, color: '#92400e', lineHeight: 19 },
});
