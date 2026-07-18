import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../hooks/useColors';
import CustomDrawer from '../../components/navigation/CustomDrawer';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
interface Screen { name: string; title: string; icon: IconName; iconActive: IconName }

const SCREENS: Screen[] = [
  { name: 'index',       title: 'Dashboard',       icon: 'grid-outline',       iconActive: 'grid'      },
  { name: 'members',     title: 'Mis Clientes',    icon: 'people-outline',     iconActive: 'people'    },
  { name: 'pt-requests', title: 'Solicitudes PT',  icon: 'hand-left-outline',  iconActive: 'hand-left' },
  { name: 'chat',        title: 'Mensajes',         icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
  { name: 'schedule',    title: 'Agenda',           icon: 'calendar-outline',   iconActive: 'calendar'  },
  { name: 'reports',     title: 'Reportes',         icon: 'bar-chart-outline',  iconActive: 'bar-chart' },
  { name: 'routines',    title: 'Rutinas',          icon: 'barbell-outline',    iconActive: 'barbell'   },
  { name: 'diets',       title: 'Dietas',           icon: 'nutrition-outline',  iconActive: 'nutrition' },
  { name: 'profile',     title: 'Perfil',           icon: 'person-outline',     iconActive: 'person'    },
];

export default function TrainerLayout() {
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

    </Drawer>
  );
}
