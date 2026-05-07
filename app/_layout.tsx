import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useAuthStore } from '@/context/AuthContext';
import { colors } from '@/utils/theme';

export default function RootLayout() {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="(auth)/login" />
      ) : (
        <>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="members/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="loans/[id]" options={{ presentation: 'modal' }} />
        </>
      )}
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
