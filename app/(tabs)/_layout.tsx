import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#2E7D32',
      tabBarStyle: { backgroundColor: '#FFF' },
      headerShown: false,
    }}>
      <Tabs.Screen
        name="index"
        options={{ title: '🎙️ Registrar' }}
      />
      <Tabs.Screen
        name="resumen"
        options={{ title: '📊 Resumen' }}
      />
    </Tabs>
  );
}