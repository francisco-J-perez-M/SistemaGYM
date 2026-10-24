import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../hooks/useColors';
import CustomDrawer from '../../components/navigation/CustomDrawer';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
interface Screen { name: string; title: string; icon: IconName; iconActive: IconName }

const SCREENS: Screen[] = [
  { name: 'index',       title: 'Dashboard',      icon: 'grid-outline',          iconActive: 'grid'          },
  { name: 'members',     title: 'Miembros',        icon: 'people-outline',        iconActive: 'people'        },
  { name: 'payments',    title: 'Pagos',           icon: 'cash-outline',          iconActive: 'cash'          },
  { name: 'pos',         title: 'Punto de Venta',  icon: 'cart-outline',          iconActive: 'cart'          },
  { name: 'reports',     title: 'Reportes',        icon: 'stats-chart-outline',   iconActive: 'stats-chart'   },
  { name: 'analytics',   title: 'Analítica IA',    icon: 'sparkles-outline',      iconActive: 'sparkles'      },
  { name: 'staff',       title: 'Staff',           icon: 'person-circle-outline', iconActive: 'person-circle' },
  { name: 'membresias',  title: 'Membresías',      icon: 'card-outline',          iconActive: 'card'          },
  { name: 'profile',     title: 'Mi Perfil',       icon: 'person-outline',        iconActive: 'person'        },
  { name: 'gym-profile', title: 'Perfil del Gym',  icon: 'business-outline',      iconActive: 'business'      },
];

export default function AdminLayout() {
  const colors = useColors();
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown:             true,
        headerStyle:             { backgroundColor: colors.card },
        headerTintColor:         colors.text,
        headerTitleStyle:        { fontWeight: '700', fontSize: 18, color: colors.text },
        headerShadowVisible:     false,
        drawerStyle:             { backgroundColor: colors.background, width: 280 },
        drawerActiveTintColor:   colors.accent,
        drawerInactiveTintColor: colors.textSecondary,
        drawerItemStyle:         { borderRadius: 12 },
        drawerLabelStyle:        { fontSize: 14, fontWeight: '500', marginLeft: -4 },
        overlayColor:            colors.overlay,
        swipeEnabled:            true,
        sceneStyle:              { backgroundColor: colors.background },
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
