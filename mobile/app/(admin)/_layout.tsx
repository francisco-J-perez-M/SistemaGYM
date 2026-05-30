/**
 * Layout del Owner / Admin — Drawer lateral izquierdo colapsible.
 *
 * Pantallas:
 *   index        → Dashboard principal
 *   members      → Miembros
 *   payments     → Pagos
 *   pos          → Punto de Venta
 *   staff        → Staff del gimnasio
 *   membresias   → Membresías (gestión)
 *   profile      → Perfil del Propietario
 *   gym-profile  → Perfil del Gimnasio
 */
import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import CustomDrawer from '../../components/navigation/CustomDrawer';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Screen { name: string; title: string; icon: IconName; iconActive: IconName }

const SCREENS: Screen[] = [
  { name: 'index',       title: 'Dashboard',      icon: 'grid-outline',          iconActive: 'grid'          },
  { name: 'members',     title: 'Miembros',        icon: 'people-outline',        iconActive: 'people'        },
  { name: 'payments',    title: 'Pagos',           icon: 'cash-outline',          iconActive: 'cash'          },
  { name: 'pos',         title: 'Punto de Venta',  icon: 'cart-outline',          iconActive: 'cart'          },
  { name: 'staff',       title: 'Staff',           icon: 'person-circle-outline', iconActive: 'person-circle' },
  { name: 'membresias',  title: 'Membresías',      icon: 'card-outline',          iconActive: 'card'          },
  { name: 'profile',     title: 'Mi Perfil',       icon: 'person-outline',        iconActive: 'person'        },
  { name: 'gym-profile', title: 'Perfil del Gym',  icon: 'business-outline',      iconActive: 'business'      },
];

export default function AdminLayout() {
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
