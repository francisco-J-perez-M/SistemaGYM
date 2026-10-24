/**
 * CustomDrawer — Sidebar izquierda compartida para todos los roles.
 * Incluye botón de accesibilidad (⚙) que abre AccessibilityPanel.
 * Reacciona al tema activo vía useColors().
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
/**
 * Contrato del contenido del cajón.
 *
 * No se reutiliza DrawerContentComponentProps de @react-navigation/drawer
 * porque expo-router reexporta el Drawer con SUS PROPIOS tipos: mismos objetos
 * en ejecución, pero declaraciones distintas. Las dos difieren, entre otras
 * cosas, en si `tintColor` es `string` o `ColorValue`, y TypeScript rechaza el
 * paso de props aunque el código funcione.
 *
 * Se declara aquí lo único que este componente consume. Es un contrato más
 * pequeño y más honesto: si algún día deja de recibirse, el error saldrá aquí
 * y no enterrado en veinte niveles de tipos genéricos.
 */
interface PropsCajon {
  state: {
    routes: { key: string; name: string }[];
    index:  number;
  };
  /** Se consume solo navigate(); el objeto real trae decenas de métodos
   *  con firmas sobrecargadas que no aportan nada aquí. */
  navigation: any;
  descriptors: Record<string, { options: any }>;
}
import { useColors, useFontScale } from '../../hooks/useColors';
import { useAuth } from '../../hooks/useAuth';
import { toStr } from '../../utils/format';
import AccessibilityPanel from '../settings/AccessibilityPanel';

function getRoleLabel(role?: string): string {
  switch (role) {
    case 'owner_gym':  return 'Propietario';
    case 'Admin':      return 'Administrador';
    case 'superadmin': return 'Super Admin';
    case 'Entrenador': return 'Entrenador';
    case 'Recepcionista':
    case 'recepcionista': return 'Recepcionista';
    case 'Miembro':
    case 'user':       return 'Miembro';
    default:           return 'Usuario';
  }
}

export default function CustomDrawer(props: PropsCajon) {
  const { state, navigation, descriptors } = props;
  const insets  = useSafeAreaInsets();
  const colors  = useColors();
  const fs      = useFontScale();
  const { user, logout } = useAuth();

  const [showA11y, setShowA11y] = useState(false);

  const nombre    = toStr(user?.nombre, 'Usuario');
  const initials  = nombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  const roleLabel = getRoleLabel(user?.role);

  return (
    <>
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>

        {/* ── Cabecera ──────────────────────────────────────────────────── */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            {user?.foto_perfil && user.foto_perfil.startsWith('data:image') ? (
              <Image source={{ uri: user.foto_perfil }}
                     style={[styles.avatarImg, { backgroundColor: colors.surface }]}
                     resizeMode="cover" />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                <Text style={[styles.initials, { color: colors.onAccent }]}>{initials}</Text>
              </View>
            )}
            <View style={styles.headerActions}>
              {/* Botón notificaciones */}
              <TouchableOpacity
                style={[styles.a11yBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push('/notifications')}
                accessibilityLabel="Notificaciones"
                accessibilityRole="button"
              >
                <Ionicons name="notifications-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              {/* Botón accesibilidad */}
              <TouchableOpacity
                style={[styles.a11yBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowA11y(true)}
                accessibilityLabel="Ajustes de accesibilidad"
                accessibilityRole="button"
              >
                <Ionicons name="accessibility-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.name,  { color: colors.text,          fontSize: 16 * fs }]} numberOfLines={1}>{nombre}</Text>
          <Text style={[styles.email, { color: colors.textSecondary, fontSize: 12 * fs }]} numberOfLines={1}>{toStr(user?.email)}</Text>
          <View style={[styles.rolePill, { backgroundColor: colors.accent + '22' }]}>
            <Text style={[styles.roleText, { color: colors.accent, fontSize: 11 * fs }]}>{roleLabel}</Text>
          </View>
        </View>

        {/* ── Ítems de navegación ───────────────────────────────────────── */}
        <ScrollView
          style={styles.navScroll}
          contentContainerStyle={styles.navList}
          showsVerticalScrollIndicator={false}
        >
          {state.routes.map((route: any, i: number) => {
            const { options } = descriptors[route.key];
            const isFocused   = state.index === i;

            const rawLabel = options.drawerLabel ?? options.title ?? route.name;
            const label    = typeof rawLabel === 'function'
              ? rawLabel({ focused: isFocused, color: isFocused ? colors.accent : colors.textSecondary })
              : rawLabel;

            const iconEl = options.drawerIcon?.({
              focused: isFocused,
              color:   isFocused ? colors.accent : colors.textSecondary,
              size:    22,
            });

            // Ocultar ítems con display:none
            const itemStyle = options.drawerItemStyle as any;
            if (itemStyle?.display === 'none') return null;

            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => navigation.navigate(route.name)}
                style={[
                  styles.navItem,
                  { borderRadius: 12 },
                  isFocused && { backgroundColor: colors.accent + '18' },
                ]}
                accessibilityRole="button"
                accessibilityLabel={String(label)}
                accessibilityState={{ selected: isFocused }}
              >
                <View style={styles.navIcon}>{iconEl}</View>
                <Text
                  style={[
                    styles.navLabel,
                    { color: isFocused ? colors.accent : colors.textSecondary, fontSize: 14 * fs },
                    isFocused && { fontWeight: '700' },
                  ]}
                  numberOfLines={1}
                >
                  {String(label)}
                </Text>
                {isFocused && (
                  <View style={[styles.activeIndicator, { backgroundColor: colors.accent }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 8, borderTopColor: colors.border }]}>
          <TouchableOpacity
            onPress={logout}
            style={styles.logoutBtn}
            accessibilityLabel="Cerrar sesión"
            accessibilityRole="button"
          >
            <View style={[styles.logoutIcon, { backgroundColor: colors.errorBg }]}>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
            </View>
            <Text style={[styles.logoutText, { color: colors.error, fontSize: 14 * fs }]}>Cerrar sesión</Text>
          </TouchableOpacity>
          <Text style={[styles.version, { color: colors.textMuted }]}>GymPro v1.0.0</Text>
        </View>
      </View>

      {/* Panel de accesibilidad */}
      <AccessibilityPanel visible={showA11y} onClose={() => setShowA11y(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1 },
  header:    { paddingHorizontal: 20, paddingVertical: 16, gap: 4, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  headerActions: { flexDirection: 'row', gap: 8 },
  avatar:    { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 60, height: 60, borderRadius: 20 },
  initials:  { fontSize: 24, fontWeight: '800' },   // color: colors.onAccent en línea
  a11yBtn:   { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  name:      { fontWeight: '700' },
  email:     {},
  rolePill:  { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginTop: 4 },
  roleText:  { fontWeight: '600' },
  navScroll: { flex: 1 },
  navList:   { paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
  navItem:   { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 14, position: 'relative' },
  navIcon:   { width: 26, alignItems: 'center' },
  navLabel:  { flex: 1, fontWeight: '500' },
  activeIndicator: { position: 'absolute', right: 0, top: '15%', bottom: '15%', width: 3, borderRadius: 2 },
  footer:    { paddingHorizontal: 12, paddingTop: 8, gap: 6, borderTopWidth: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  logoutIcon:{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logoutText:{ fontWeight: '600' },
  version:   { fontSize: 11, textAlign: 'center', paddingBottom: 4 },
});
