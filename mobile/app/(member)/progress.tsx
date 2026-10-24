/**
 * Pantalla Progreso Físico — historial de peso con gráfica + registro.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { ENDPOINTS } from '../../constants/Api';
import { useFetch } from '../../hooks/useFetch';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import type { BodyProgress } from '../../types';

const SCREEN_W = Dimensions.get('window').width;

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { data: records, loading, refetch } = useFetch<BodyProgress[]>(ENDPOINTS.BODY_PROGRESS);
  const [modalVisible, setModalVisible] = useState(false);
  const [peso,    setPeso]    = useState('');
  const [cintura, setCintura] = useState('');
  const [cadera,  setCadera]  = useState('');
  const [saving,  setSaving]  = useState(false);

  const sorted = [...(records ?? [])].sort(
    (a, b) => new Date(a.fecha_registro).getTime() - new Date(b.fecha_registro).getTime()
  );

  const chartData = sorted.slice(-10);
  const labels    = chartData.map((r) => r.fecha_registro.slice(5)); // MM-DD
  const weights   = chartData.map((r) => r.peso);

  const last   = sorted[sorted.length - 1];
  const first  = sorted[0];
  const change = last && first ? (last.peso - first.peso).toFixed(1) : null;

  const saveProgress = async () => {
    if (!peso) return;
    setSaving(true);
    try {
      await api.post(ENDPOINTS.USER_PROGRESS, {
        peso:    parseFloat(peso),
        cintura: cintura ? parseFloat(cintura) : undefined,
        cadera:  cadera  ? parseFloat(cadera)  : undefined,
      });
      setModalVisible(false);
      setPeso(''); setCintura(''); setCadera('');
      refetch();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Cargando progreso…" />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.accent} />}
    >
      {/* Header */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.title} accessibilityRole="header">Progreso</Text>
          <Text style={styles.subtitle}>{sorted.length} registros totales</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
          accessibilityLabel="Registrar medición"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Summary row */}
      {last && (
        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard} padding={14}>
            <Text style={styles.sumLabel}>Peso actual</Text>
            <Text style={styles.sumValue}>{last.peso} <Text style={styles.sumUnit}>kg</Text></Text>
          </Card>
          {last.bmi && (
            <Card style={styles.summaryCard} padding={14}>
              <Text style={styles.sumLabel}>IMC</Text>
              <Text style={styles.sumValue}>{last.bmi}</Text>
            </Card>
          )}
          {change !== null && (
            <Card style={styles.summaryCard} padding={14}>
              <Text style={styles.sumLabel}>Cambio total</Text>
              <Text style={[styles.sumValue, {
                color: parseFloat(change) < 0 ? Colors.success :
                       parseFloat(change) > 0 ? Colors.error : Colors.text
              }]}>
                {parseFloat(change) > 0 ? '+' : ''}{change} kg
              </Text>
            </Card>
          )}
        </View>
      )}

      {/* Chart */}
      {chartData.length >= 2 ? (
        <Card padding={12}>
          <Text style={styles.chartTitle}>Evolución de peso</Text>
          <LineChart
            data={{ labels, datasets: [{ data: weights }] }}
            width={SCREEN_W - 64}
            height={180}
            chartConfig={{
              backgroundColor:      'transparent',
              backgroundGradientFrom: Colors.card,
              backgroundGradientTo:   Colors.card,
              decimalPlaces:          1,
              color:        (opacity = 1) => `rgba(108,99,255,${opacity})`,
              labelColor:   () => Colors.textSecondary,
              strokeWidth:  2,
              propsForDots: { r: '4', strokeWidth: '2', stroke: Colors.accentLight },
            }}
            bezier
            style={{ borderRadius: 12 }}
            withInnerLines={false}
          />
        </Card>
      ) : (
        <Card>
          <View style={styles.emptyChart}>
            <Ionicons name="trending-up-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              Registra al menos 2 mediciones para ver la gráfica de evolución.
            </Text>
          </View>
        </Card>
      )}

      {/* History list */}
      <Card>
        <Text style={styles.chartTitle}>Historial</Text>
        {sorted.length === 0 ? (
          <Text style={styles.emptyText}>No hay registros aún.</Text>
        ) : (
          [...sorted].reverse().slice(0, 15).map((r) => (
            <View key={r._id} style={styles.histRow}>
              <View>
                <Text style={styles.histDate}>{r.fecha_registro.slice(0, 10)}</Text>
                <View style={styles.histMeasures}>
                  {r.cintura && <Text style={styles.histMini}>Cintura: {r.cintura}cm</Text>}
                  {r.cadera  && <Text style={styles.histMini}>Cadera: {r.cadera}cm</Text>}
                  {r.bmi     && <Text style={styles.histMini}>IMC: {r.bmi}</Text>}
                </View>
              </View>
              <Text style={styles.histPeso}>{r.peso} <Text style={styles.histUnit}>kg</Text></Text>
            </View>
          ))
        )}
      </Card>

      {/* Modal — nueva medición */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva medición</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} accessibilityLabel="Cerrar">
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Peso (kg) *</Text>
            <TextInput
              style={styles.modalInput}
              value={peso}
              onChangeText={setPeso}
              keyboardType="decimal-pad"
              placeholder="e.g. 72.5"
              placeholderTextColor={Colors.textMuted}
              accessibilityLabel="Peso en kilogramos"
            />
            <Text style={styles.inputLabel}>Cintura (cm)</Text>
            <TextInput
              style={styles.modalInput}
              value={cintura}
              onChangeText={setCintura}
              keyboardType="decimal-pad"
              placeholder="e.g. 80"
              placeholderTextColor={Colors.textMuted}
              accessibilityLabel="Cintura en centímetros"
            />
            <Text style={styles.inputLabel}>Cadera (cm)</Text>
            <TextInput
              style={styles.modalInput}
              value={cadera}
              onChangeText={setCadera}
              keyboardType="decimal-pad"
              placeholder="e.g. 95"
              placeholderTextColor={Colors.textMuted}
              accessibilityLabel="Cadera en centímetros"
            />
            <Button label="Guardar" onPress={saveProgress} loading={saving} disabled={!peso} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: Colors.background },
  content:  { padding: 20, gap: 16, paddingBottom: 32 },
  topRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title:    { color: Colors.text, fontSize: 26, fontWeight: '700' },
  subtitle: { color: Colors.textSecondary, fontSize: 13 },
  addBtn: {
    width:  44, height: 44, borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1 },
  sumLabel:    { color: Colors.textSecondary, fontSize: 11, marginBottom: 4 },
  sumValue:    { color: Colors.text, fontSize: 20, fontWeight: '700' },
  sumUnit:     { fontSize: 13, color: Colors.textSecondary },
  chartTitle:  { color: Colors.text, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  emptyChart:  { alignItems: 'center', paddingVertical: 24, gap: 10 },
  emptyText:   { color: Colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  histRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  histDate:     { color: Colors.text, fontSize: 14, fontWeight: '600' },
  histMeasures: { flexDirection: 'row', gap: 8, marginTop: 2 },
  histMini:     { color: Colors.textMuted, fontSize: 11 },
  histPeso:     { color: Colors.accent, fontSize: 18, fontWeight: '700' },
  histUnit:     { fontSize: 13, color: Colors.textSecondary },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle:  { color: Colors.text, fontSize: 18, fontWeight: '700' },
  inputLabel:  { color: Colors.textSecondary, fontSize: 13, marginBottom: 4, marginTop: 8 },
  modalInput: {
    backgroundColor: Colors.inputBg, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.text, padding: 14, fontSize: 15,
  },
});
