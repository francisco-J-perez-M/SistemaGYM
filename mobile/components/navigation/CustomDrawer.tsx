/**
 * CustomDrawer — Sidebar izquierda compartida para todos los roles.
 *
 * Recibe DrawerContentComponentProps de @react-navigation/drawer.
 * Lee las rutas activas del estado del navegador y llama a drawerIcon/drawerLabel
 * de cada descriptor para renderizar el ítem correspondiente.
 */
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../hooks/useAuth';
import { toStr } from '../../utils/format';

// ─── helpers ──────────────────────────────────────────────────────────────────

function getRoleLabel(role?: string): string {
  switch (role) {
    case 'owner_gym':   return 'Propietario';
    case 'Admin':       return 'Administrador';
    case 'superadmin':  return 'Super Admin';
    case 'Entrenador':  return 'Entrenador';
    case 'Miembro':
    case 'user':        return 'Miembro';
    default:            return 'Usuario';
  }
}

// ─── componente ───────────────────────────────────────────────────────────────

export default function CustomDrawer(props: DrawerContentComponentProps) {
  const { state, navigation, descriptors } = props;
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const nombre   = toStr(user?.nombre, 'Usuario');
  const initials = nombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  const roleLabel = getRoleLabel(user?.role);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Cabecera: avatar + nombre + rol ────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>{nombre}</Text>
        <Text style={styles.email} numberOfLines={1}>{toStr(user?.email)}</Text>
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>{roleLabel}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ── Ítems de navegación ────────────────────────────────────────────── */}
      <ScrollView
        style={styles.navScroll}
        contentContainerStyle={styles.navList}
        showsVerticalScrollIndicator={false}
      >
        {state.routes.map((route: any, i: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === i;

          // El label puede venir de drawerLabel (función o string) o de title
          const rawLabel = options.drawerLabel ?? options.title ?? route.name;
          const label = typeof rawLabel === 'function'
            ? rawLabel({ focused: isFocused, color: isFocused ? Colors.accent : Colors.textSecondary })
            : rawLabel;

          const iconEl = options.drawerIcon?.({
            focused: isFocused,
            color:   isFocused ? Colors.accent : Colors.textSecondary,
            size:    22,
          });

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={[styles.navItem, isFocused && styles.navItemActive]}
              accessibilityRole="button"
              accessibilityLabel={String(label)}
              accessibilityState={{ selected: isFocused }}
            >
              <View style={styles.navIcon}>{iconEl}</View>
              <Text
                style={[styles.navLabel, isFocused && styles.navLabelActive]}
                numberOfLines={1}
              >
                {String(label)}
              </Text>
              {isFocused && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Footer: cerrar sesión ──────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.divider} />
        <TouchableOpacity
          onPress={logout}
          style={styles.logoutBtn}
          accessibilityLabel="Cerrar sesión"
          accessibilityRole="button"
        >
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          </View>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
        <Text style={styles.version}>GymPro v1.0.0</Text>
      </View>
    </View>
  );
}

// ─── estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.background,
  },

  /* Cabecera */
  header: {
    paddingHorizontal: 20,
    paddingVertical:   20,
    gap:               4,
  },
  avatar: {
    width:           60,
    height:          60,
    borderRadius:    20,
    backgroundColor: Colors.accent,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    10,
  },
  initials:  { color: '#fff', fontSize: 24, fontWeight: '800' },
  name:      { color: Colors.text, fontSize: 16, fontWeight: '700' },
  email:     { color: Colors.textSecondary, fontSize: 12 },
  rolePill: {
    alignSelf:         'flex-start',
    backgroundColor:   'rgba(108,99,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical:   3,
    borderRadius:      20,
    marginTop:         6,
  },
  roleText: { color: Colors.accent, fontSize: 11, fontWeight: '600' },

  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },

  /* Nav */
  navScroll: { flex: 1 },
  navList:   { paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
  navItem: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius:   12,
    position:       'relative',
  },
  navItemActive: { backgroundColor: 'rgba(108,99,255,0.10)' },
  navIcon:  { width: 26, alignItems: 'center' },
  navLabel: {
    flex:       1,
    color:      Colors.textSecondary,
    fontSize:   14,
    fontWeight: '500',
  },
  navLabelActive: { color: Colors.accent, fontWeight: '700' },
  activeIndicator: {
    position:     'absolute',
    right:        0,
    top:          '15%',
    bottom:       '15%',
    width:        3,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },

  /* Footer */
  footer:    { paddingHorizontal: 12, paddingTop: 8, gap: 8 },
  logoutBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               14,
    paddingVertical:   12,
    paddingHorizontal: 14,
    borderRadius:      12,
  },
  logoutIcon: {
    width:           36,
    height:          36,
    borderRadius:    10,
    backgroundColor: Colors.errorBg,
    alignItems:      'center',
    justifyContent:  'center',
  },
  logoutText: { color: Colors.error, fontSize: 14, fontWeight: '600' },
  version:    { color: Colors.textMuted, fontSize: 11, textAlign: 'center', paddingBottom: 4 },
});
