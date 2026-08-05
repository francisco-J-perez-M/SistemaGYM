/**
 * TicketVenta — comprobante de una venta del punto de venta.
 *
 * Es el equivalente móvil de web/src/pages/owner_gym/POSTicketModal.jsx: mismo
 * encabezado, mismo desglose de artículos y el mismo total, para que un ticket
 * emitido desde el celular y otro emitido desde la web sean el mismo documento.
 *
 * El teléfono no imprime, así que en lugar del botón "Imprimir" de la web
 * ofrece "Compartir": arma el recibo en texto plano y lo entrega a la hoja de
 * compartir nativa, desde donde el usuario lo manda por WhatsApp, correo o lo
 * copia. Se usa `Share` de React Native, ya incluido, para no añadir un módulo
 * nativo que obligaría a regenerar el development build.
 *
 * Lo consumen tanto la pantalla del propietario (app/(admin)/pos.tsx) como la
 * del miembro, por eso vive en components y no dentro de una ruta.
 *
 * SECCIONES QUE PINTA
 *   fondo del modal ... colors.card
 *   marca ............. colors.accent
 *   importes .......... colors.dataProgreso
 *   separadores ....... colors.border (línea punteada, como un ticket real)
 */
import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Share, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useFontScale } from '../../hooks/useColors';
import { toArray, toStr } from '../../utils/format';

/** Artículo del ticket. El backend ha usado `qty` y `cantidad` según la ruta. */
export interface TicketItem {
  nombre?:          string;
  cantidad?:        number;
  qty?:             number;
  precio?:          number;
  precio_unitario?: number;
}

export interface TicketVentaData {
  _id?:            string;
  id?:             string;
  fecha?:          string;
  total?:          number;
  metodo_pago?:    string;
  nombre_miembro?: string;
  items?:          TicketItem[];
}

interface Props {
  venta:   TicketVentaData | null;
  /** Nombre del gimnasio para el encabezado; si falta se usa la marca. */
  gimnasio?: string;
  onClose: () => void;
}

const money = (n: number) =>
  `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Cantidad del artículo, venga con el nombre que venga. */
const cant = (it: TicketItem) => Number(it.cantidad ?? it.qty ?? 1);
/** Precio unitario del artículo, venga con el nombre que venga. */
const unit = (it: TicketItem) => Number(it.precio_unitario ?? it.precio ?? 0);

function fechaLegible(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return toStr(iso);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
       + ' · ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

/** Folio corto y legible; el id de Mongo completo no le sirve a nadie. */
function folio(v: TicketVentaData): string {
  const id = toStr(v._id ?? v.id);
  return id ? `#${id.slice(-8).toUpperCase()}` : '';
}

export default function TicketVenta({ venta, gimnasio, onClose }: Props) {
  const colors = useColors();
  const fs     = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);

  if (!venta) return null;

  const items    = toArray<TicketItem>(venta.items);
  const encabeza = toStr(gimnasio, 'GYM PRO').toUpperCase();
  // El total del backend manda; la suma de artículos sólo cubre el caso de una
  // venta antigua guardada sin campo `total`.
  const total = Number(venta.total ?? items.reduce((s, it) => s + unit(it) * cant(it), 0));

  const compartir = async () => {
    const lineas = [
      encabeza,
      'Comprobante de venta',
      folio(venta),
      fechaLegible(venta.fecha),
      venta.nombre_miembro ? `Cliente: ${toStr(venta.nombre_miembro)}` : '',
      '------------------------------',
      ...items.map((it) => `${toStr(it.nombre)} x${cant(it)}   ${money(unit(it) * cant(it))}`),
      '------------------------------',
      `TOTAL   ${money(total)}`,
      venta.metodo_pago ? `Pago: ${toStr(venta.metodo_pago)}` : '',
      '',
      'Gracias por su compra.',
    ].filter(Boolean);

    try {
      await Share.share({ message: lineas.join('\n') });
    } catch {
      Alert.alert('No se pudo compartir', 'Intenta de nuevo en un momento.');
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.hoja}>
          <View style={styles.barra}>
            <Text style={styles.barraTxt}>Comprobante de venta</Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityLabel="Cerrar comprobante"
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cuerpo}>
            {/* Encabezado */}
            <View style={styles.cabecera}>
              <Text style={styles.marca}>{encabeza}</Text>
              <Text style={styles.marcaSub}>Punto de venta</Text>
              <Text style={styles.fecha}>{fechaLegible(venta.fecha)}</Text>
              {!!folio(venta) && <Text style={styles.folio}>{folio(venta)}</Text>}
            </View>

            {/* Cliente */}
            {!!venta.nombre_miembro && (
              <View style={styles.bloque}>
                <Text style={styles.etiqueta}>Cliente</Text>
                <Text style={styles.valor}>{toStr(venta.nombre_miembro)}</Text>
              </View>
            )}

            {/* Artículos */}
            <View style={styles.bloque}>
              <View style={styles.filaCabecera}>
                <Text style={styles.colTitulo}>ARTÍCULO</Text>
                <Text style={styles.colTitulo}>IMPORTE</Text>
              </View>
              {items.length === 0 ? (
                <Text style={styles.vacio}>Esta venta no tiene el desglose guardado.</Text>
              ) : (
                items.map((it, i) => (
                  <View key={`${toStr(it.nombre)}-${i}`} style={styles.fila}>
                    <Text style={styles.itemNombre} numberOfLines={2}>
                      {toStr(it.nombre, 'Artículo')}
                      <Text style={styles.itemQty}>  ×{cant(it)}</Text>
                    </Text>
                    <Text style={styles.itemImporte}>{money(unit(it) * cant(it))}</Text>
                  </View>
                ))
              )}
            </View>

            {/* Total */}
            <View style={styles.bloqueTotal}>
              <Text style={styles.totalTxt}>TOTAL</Text>
              <Text style={styles.totalMonto}>{money(total)}</Text>
            </View>

            {!!venta.metodo_pago && (
              <Text style={styles.metodo}>Pago con {toStr(venta.metodo_pago)}</Text>
            )}

            <Text style={styles.gracias}>Gracias por su compra</Text>
          </ScrollView>

          <TouchableOpacity
            style={styles.btnCompartir}
            onPress={compartir}
            accessibilityRole="button"
            accessibilityLabel="Compartir comprobante"
          >
            <Ionicons name="share-outline" size={18} color={colors.onAccent ?? '#fff'} />
            <Text style={styles.btnTxt}>Compartir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    overlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,.65)',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    },
    hoja: {
      width: '100%', maxWidth: 380, maxHeight: '88%',
      backgroundColor: colors.card, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    },
    barra: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4,
    },
    barraTxt: { color: colors.textSecondary, fontSize: 12 * fs },
    cuerpo:   { paddingHorizontal: 22, paddingBottom: 18 },

    cabecera: {
      alignItems: 'center', paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: colors.border, borderStyle: 'dashed',
    },
    marca:    { color: colors.accent, fontSize: 20 * fs, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
    marcaSub: { color: colors.textSecondary, fontSize: 11 * fs, marginTop: 2 },
    fecha:    { color: colors.textMuted, fontSize: 11 * fs, marginTop: 5, textAlign: 'center' },
    folio:    { color: colors.textMuted, fontSize: 10 * fs, marginTop: 2, letterSpacing: 1 },

    bloque: {
      paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: colors.border, borderStyle: 'dashed',
    },
    etiqueta: { color: colors.textSecondary, fontSize: 11 * fs, marginBottom: 2 },
    valor:    { color: colors.text, fontSize: 14 * fs, fontWeight: '700' },

    filaCabecera: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingBottom: 6, marginBottom: 6,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    colTitulo: { color: colors.textMuted, fontSize: 10 * fs, letterSpacing: 1 },
    fila: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, gap: 10 },
    itemNombre:  { color: colors.text, fontSize: 13 * fs, flex: 1 },
    itemQty:     { color: colors.textSecondary, fontSize: 12 * fs },
    itemImporte: { color: colors.dataProgreso, fontSize: 13 * fs, fontWeight: '700' },
    vacio:       { color: colors.textMuted, fontSize: 12 * fs, fontStyle: 'italic' },

    bloqueTotal: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 14,
    },
    totalTxt:   { color: colors.text, fontSize: 16 * fs, fontWeight: '900', letterSpacing: 1 },
    totalMonto: { color: colors.dataProgreso, fontSize: 20 * fs, fontWeight: '900' },

    metodo:  { color: colors.textSecondary, fontSize: 12 * fs, textAlign: 'center' },
    gracias: { color: colors.textMuted, fontSize: 11 * fs, textAlign: 'center', marginTop: 12, letterSpacing: 1 },

    btnCompartir: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.accent, paddingVertical: 14,
    },
    btnTxt: { color: colors.onAccent ?? '#fff', fontSize: 15 * fs, fontWeight: '700' },
  });
}
