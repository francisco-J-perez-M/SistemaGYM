import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../hooks/useColors';
import CustomDrawer from '../../components/navigation/CustomDrawer';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
interface Screen { name: string; title: string; icon: IconName; iconActive: IconName }

const SCREENS: Screen[] = [
  { name: 'index',      title: 'Inicio',             icon: 'home-outline',      iconActive: 'home'      },
  { name: 'pos',        title: 'Punto de Venta',     icon: 'cart-outline',      iconActive: 'cart'      },
  { name: 'training',   title: 'Entrenamiento',      icon: 'barbell-outline',   iconActive: 'barbell'   },
  { name: 'workout-log',title: 'Registrar Entreno',  icon: 'fitness-outline',   iconActive: 'fitness'   },
  { name: 'nutrition',  title: 'Nutrición y Dietas', icon: 'nutrition-outline', iconActive: 'nutrition'  },
  { name: 'membership', title: 'Mi Membresía',       icon: 'card-outline',      iconActive: 'card'      },
  { name: 'payments',   title: 'Pagos',              icon: 'receipt-outline',   iconActive: 'receipt'   },
  { name: 'health',     title: 'Salud',              icon: 'pulse-outline',     iconActive: 'pulse'     },
  { name: 'profile',    title: 'Mi Perfil',          icon: 'person-outline',    iconActive: 'person'    },
];

export default function MemberLayout() {
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
        overlayColor:            'rgba(0,0,0,0.55)',
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
      {['progress', 'routines', 'chat'].map((name) => (
        <Drawer.Screen
          key={name}
          name={name}
          options={{ drawerItemStyle: { display: 'none' }, title: name }}
        />
      ))}
    </Drawer>
  );
}
