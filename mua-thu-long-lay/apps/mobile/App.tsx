import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { festival } from '@mtll/shared';
import type { RootStackParamList } from './src/navigation';
import { LanguageScreen } from './src/screens/LanguageScreen';
import { MapScreen } from './src/screens/MapScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { ScheduleScreen } from './src/screens/ScheduleScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { StallDetailScreen } from './src/screens/StallDetailScreen';
import { StallsScreen } from './src/screens/StallsScreen';
import { StampsScreen } from './src/screens/StampsScreen';
import { SettingsProvider, useSettings } from './src/state/settings';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

type IconName = ComponentProps<typeof Ionicons>['name'];
const TAB_ICONS: Record<string, IconName> = {
  Map: 'map-outline',
  Stalls: 'storefront-outline',
  Schedule: 'musical-notes-outline',
  Stamps: 'ribbon-outline',
  Settings: 'settings-outline',
};

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    primary: colors.accent,
    text: colors.ink,
    border: colors.line,
  },
};

function Tabs() {
  const { t, tl } = useSettings();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.accentInk,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color, size }) => <Ionicons name={TAB_ICONS[route.name]} color={color} size={size} />,
        headerTitleStyle: { fontWeight: '700' },
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} options={{ title: t('tab.map'), headerTitle: tl(festival.name) }} />
      <Tab.Screen name="Stalls" component={StallsScreen} options={{ title: t('tab.stalls') }} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ title: t('tab.schedule') }} />
      <Tab.Screen name="Stamps" component={StampsScreen} options={{ title: t('tab.stamps') }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: t('tab.settings') }} />
    </Tab.Navigator>
  );
}

function Root() {
  const { ready, lang, t } = useSettings();
  if (!ready)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  if (!lang) return <LanguageScreen />;
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="StallDetail" component={StallDetailScreen} options={{ title: '' }} />
        <Stack.Screen name="Scanner" component={ScannerScreen} options={{ presentation: 'modal', title: t('map.scan') }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <StatusBar style="dark" />
        <Root />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
