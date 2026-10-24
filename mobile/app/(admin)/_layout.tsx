import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Platform } from 'react-native';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; label: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index',    label: 'Panel',     icon: 'grid-outline',       iconActive: 'grid'          },
  { name: 'members',  label: 'Miembros',  icon: 'people-outline',     iconActive: 'people'        },
  { name: 'payments', label: 'Cobros',    icon: 'cash-outline',       iconActive: 'cash'          },
  { name: 'profile',  label: 'Perfil',    icon: 'person-outline',     iconActive: 'person'        },
];

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:             false,
        tabBarStyle: {
          backgroundColor:  Colors.card,
          borderTopColor:   Colors.border,
          borderTopWidth:   1,
          height:           Platform.OS === 'ios' ? 82 : 64,
          paddingBottom:    Platform.OS === 'ios' ? 24 : 8,
          paddingTop:       8,
        },
        tabBarActiveTintColor:   Colors.accent,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle:        { fontSize: 10, fontWeight: '600' },
        tabBarHideOnKeyboard:    true,
      }}
    >
      {TABS.map(({ name, label, icon, iconActive }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: label,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? iconActive : icon} size={22} color={color} accessibilityLabel={label} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
