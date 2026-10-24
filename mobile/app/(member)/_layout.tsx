/**
 * Layout del Miembro — Drawer lateral izquierdo colapsible.
 *
 * Pantallas:
 *   index      → Inicio (Dashboard)
 *   pos        → Punto de Venta
 *   training   → Entrenamiento
 *   nutrition  → Nutrición y Dietas
 *   membership → Mi Membresía
 *   profile    → Mi Perfil
 */
import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import CustomDrawer from '../../components/navigation/CustomDrawer';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Screen { name: string; title: string; icon: IconName; iconActive: IconName }

const SCREENS: Screen[] = [
  { name: 'index',      title: 'Inicio',             icon: 'home-outline',      iconActive: 'home'      },
  { name: 'pos',        title: 'Punto de Venta',     icon: 'cart-outline',      iconActive: 'cart'      },
  { name: 'training',   title: 'Entrenamiento',      icon: 'barbell-outline',   iconActive: 'barbell'   },
  { name: 'nutrition',  title: 'Nutrición y Dietas', icon: 'nutrition-outline', iconActive: 'nutrition'  },
  { name: 'membership', title: 'Mi Membresía',       icon: 'card-outline',      iconActive: 'card'      },
  { name: 'profile',    title: 'Mi Perfil',          icon: 'person-outline',    iconActive: 'person'    },
];

export default function MemberLayout() {
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
      {/* Rutas del filesystem que no deben aparecer en el drawer */}
      {['progress', 'routines'].map((name) => (
        <Drawer.Screen
          key={name}
          name={name}
          options={{ drawerItemStyle: { display: 'none' }, title: name }}
        />
      ))}
    </Drawer>
  );
}
