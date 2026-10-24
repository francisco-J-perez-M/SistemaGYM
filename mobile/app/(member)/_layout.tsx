import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Platform, View } from 'react-native';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; label: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index',      label: 'Inicio',    icon: 'home-outline',      iconActive: 'home'          },
  { name: 'routines',   label: 'Rutinas',   icon: 'barbell-outline',   iconActive: 'barbell'       },
  { name: 'progress',   label: 'Progreso',  icon: 'trending-up-outline', iconActive: 'trending-up' },
  { name: 'nutrition',  label: 'Nutrición', icon: 'nutrition-outline', iconActive: 'nutrition'     },
  { name: 'profile',    label: 'Perfil',    icon: 'person-outline',    iconActive: 'person'        },
];

export default function MemberLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:      false,
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
        tabBarLabelStyle: {
          fontSize:   10,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      {TABS.map(({ name, label, icon, iconActive }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: label,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? iconActive : icon}
                size={22}
                color={color}
                accessibilityLabel={label}
              />
            ),
            tabBarAccessibilityLabel: label,
          }}
        />
      ))}
    </Tabs>
  );
}
