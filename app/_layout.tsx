import { Stack } from 'expo-router';
import { MarkersProvider } from '../components/MarkersContext';

export default function RootLayout() {
  return (
    <MarkersProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Карта' }} />
        <Stack.Screen name="marker/[id]" options={{ title: 'Детали маркера' }} />
      </Stack>
    </MarkersProvider>
  );
}