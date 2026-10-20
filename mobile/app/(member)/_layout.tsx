import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../hooks/useColors';
import CustomDrawer from '../../components/navigation/CustomDrawer';
import PerfilCompletoBadge from '../../components/navigation/PerfilCompletoBadge';
import SyncStatusBadge from '../../components/shared/SyncStatusBadge';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
interface Screen { name: string; title: string; icon: IconName; iconActive: IconName }

const SCREENS: Screen[] = [
  { name: 'index',      title: 'Inicio',             icon: 'home-outline',      iconActive: 'home'      },
  { name: 'pos',        title: 'Punto de Venta',     icon: 'cart-outline',      iconActive: 'cart'      },
  { name: 'training',   title: 'Entrenamiento',      icon: 'barbell-outline',   iconActive: 'barbell'   },
  { name: 'mi-rutina',  title: 'Mi Rutina',          icon: 'create-outline',    iconActive: 'create'    },
  { name: 'workout-log',title: 'Registrar Entreno',  icon: 'fitness-outline',   iconActive: 'fitness'   },
  { name: 'nutrition',  title: 'Nutrición y Dietas', icon: 'nutrition-outline', iconActive: 'nutrition'  },
  { name: 'membership', title: 'Mi Membresía',       icon: 'card-outline',      iconActive: 'card'      },
  { name: 'payments',   title: 'Pagos',              icon: 'receipt-outline',   iconActive: 'receipt'   },
  // SCRUM: antes solo vivía como pantalla oculta (se llegaba desde el badge
  // de perfil); ahora tiene título/ícono propios porque entra al grupo
  // desplegable "Progreso y Salud" del cajón (ver CustomDrawer.tsx) junto
  // con Salud y Predicción — ya no hace falta ocultarla, CustomDrawer la
  // anida y nunca la dibuja como ítem plano.
  { name: 'progress',   title: 'Progreso Físico',    icon: 'body-outline',      iconActive: 'body'       },
  { name: 'health',     title: 'Salud',              icon: 'pulse-outline',     iconActive: 'pulse'     },
  { name: 'prediccion', title: 'Predicción de Peso', icon: 'trending-up-outline', iconActive: 'trending-up' },
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
        // SCRUM-102: indicador circular de pendientes, visible desde
        // cualquier pantalla del rol Miembro (headerRight aplica a todas
        // las Drawer.Screen de este layout).
        // SCRUM-168 / HU-30: SyncStatusBadge se agrega aquí mismo, no en cada
        // pantalla, para que el estado de conexión/sincronización aparezca en
        // todas sin tocarlas una por una — mismo criterio que el badge de
        // perfil.
        headerRight:             () => (
          <>
            <SyncStatusBadge />
            <PerfilCompletoBadge />
          </>
        ),
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
      {(['routines', 'chat', 'start-workout', 'checkin-qr'] as const).map((name) => (
        <Drawer.Screen
          key={name}
          name={name}
          options={{
            drawerItemStyle: { display: 'none' },
            // checkin-qr es nueva (QR general de check-in): se le da un
            // título legible en vez de usar el nombre de archivo tal cual,
            // como hacían las demás pantallas ocultas de este grupo.
            title: name === 'checkin-qr' ? 'Registrar entrada' : name,
          }}
        />
      ))}
    </Drawer>
  );
}
