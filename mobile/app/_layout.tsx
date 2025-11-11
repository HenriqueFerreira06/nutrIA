// app/_layout.tsx (Sem alterações)
import { Stack } from 'expo-router';
import { Text } from 'react-native';
import React, { useEffect } from 'react';
import { AuthProvider, AuthGuard } from '../context/AuthContext'; // Verifique o caminho
import { useFonts } from 'expo-font';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

ExpoSplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
    'Montserrat-SemiBold': require('../assets/fonts/Montserrat-SemiBold.ttf'),
    'Montserrat-Medium': require('../assets/fonts/Montserrat-Medium.ttf'),
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || error) {
      ExpoSplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGuard>

          <Stack screenOptions={{ 
              headerShown: false,
              animation: 'fade'
              }}>

            {/* Grupo de Abas (Gerenciado por seu próprio layout) */}
            <Stack.Screen name="(TelasAbas)" />

            {/* Telas de Autenticação */}
            <Stack.Screen name="TelasCadastroLogin/welcome" />
            <Stack.Screen name="TelasCadastroLogin/login" />
            <Stack.Screen name="TelasCadastroLogin/cadastro" />
            <Stack.Screen name="TelasCadastroLogin/esqueciSenha" />

            {/* Telas do Formulário */}
            <Stack.Screen name="TelasFormulario/objetivo1" />
            <Stack.Screen name="TelasFormulario/biometria2" />
            <Stack.Screen name="TelasFormulario/atividadeFisica3" />
            <Stack.Screen name="TelasFormulario/modeloDieta4" />
            <Stack.Screen name="TelasFormulario/orcamento5" />
            <Stack.Screen name="TelasFormulario/saude6" />
            <Stack.Screen name="TelasFormulario/restricoes7" />

            {/* Telas de Desbloqueio/Geração */}
            <Stack.Screen name="TelasDesbloquearPlano/gerandoPlano" />
            <Stack.Screen name="TelasDesbloquearPlano/plano" />

            {/* Telas Variadas importantes */}
            <Stack.Screen name="TelasVariadas/termosUsoPriv" />
            <Stack.Screen name="TelasVariadas/refeicao" />
            <Stack.Screen name="TelasVariadas/produto" />
            <Stack.Screen name="TelasVariadas/leitor" />
            <Stack.Screen name="TelasVariadas/reportDetail" />

            {/* Telas de Perfil (acessadas via Stack) */}
            <Stack.Screen name="TelasPerfil/editar" />
            <Stack.Screen name="TelasPerfil/plano" />            
            <Stack.Screen name="TelasPerfil/conquistas" />
            <Stack.Screen name="TelasPerfil/config" />
            <Stack.Screen name="TelasPerfil/notificacao" />
            <Stack.Screen name="TelasPerfil/assinatura" />
            <Stack.Screen name="TelasPerfil/privacidade" />
          </Stack>
        </AuthGuard>
      </AuthProvider>
    </QueryClientProvider>
  );
}