/**
 * Layout del Entrenador — Drawer lateral izquierdo colapsible.
 *
 * Pantallas:
 *   index        → Dashboard principal
 *   members      → Mis Clientes
 *   pt-requests  → Solicitudes PT
 *   schedule     → Agenda
 *   routines     → Rutinas
 *   profile      → Perfil
 */
import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import CustomDrawer from '../../components/navigation/CustomDrawer';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Screen { name: string; title: string; icon: IconName; iconActive: IconName }

const SCREENS: Screen[] = [
  { name: 'index',       title: 'Dashboard',       icon: 'grid-outline',    iconActive: 'grid'    },
  { name: 'members',     title: 'Mis Clientes',    icon: 'people-outline',  iconActive: 'people'  },
  { name: 'pt-requests', title: 'Solicitudes PT',  icon: 'hand-left-outline', iconActive: 'hand-left' },
  { name: 'schedule',    title: 'Agenda',           icon: 'calendar-outline',iconActive: 'calendar'},
  { name: 'routines',    title: 'Rutinas',          icon: 'barbell-outline', iconActive: 'barbell' },
  { name: 'profile',     title: 'Perfil',           icon: 'person-outline',  iconActive: 'person'  },
];

export default function TrainerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown:             true,
        headerStyle:             { backgroundColor: Colors.card },
        headerTintColor:         Colors.text,
        headerTitleStyle:        { fontWeight: '700', fontSize: 18, color: Colors.text },
        headerShadowVisible:     false,
        drawerStyle:             { backgroundColor: Colors.background, width: 280 },
        drawerActiveTintColor:   Colors.accent,
        drawerInactiveTintColor: Colors.textSecondary,
        drawerItemStyle:         { borderRadius: 12 },
        drawerLabelStyle:        { fontSize: 14, fontWeight: '500', marginLeft: -4 },
        overlayColor:            'rgba(0,0,0,0.55)',
        swipeEnabled:            true,
      }}
    >
      {SCREENS.map(({ name, title, icon, iconActive }) => (
        <Drawer.Screen
          key={name}
          name={name}
          options={{
            title,
            drawerIcon: ({ focused, color }) => (
              <Ionicons name={focused ? iconActive : icon} size={22} color={color} />
            ),
          }}
        />
      ))}
    </Drawer>
  );
}
