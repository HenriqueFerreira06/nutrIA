import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
const TabBarIcon = ({ name, color }: { name: React.ComponentProps<typeof Ionicons>['name']; color: string }) => {
  return <Ionicons size={32} style={{ marginBottom: -5 }} name={name} color={color} />;
};
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3CB371', 
        tabBarInactiveTintColor: '#888',
        tabBarShowLabel: false, 
        tabBarStyle: Platform.select({
          ios: { 
            position: 'absolute',
            height: 80,
         },
          android: {
            height: 80,
            paddingTop: 20,
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="despensa"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'barcode' : 'barcode-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="comunidade"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'people' : 'people-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="relatorio"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'document-text' : 'document-text-outline'} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="conquistas"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'trophy' : 'trophy-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="relatorio-detalhe"
        options={{
          href: null, 
          tabBarStyle: { display: 'none' }
        }}
      />
      <Tabs.Screen
name="perfil" 
options={{
href: null, 
tabBarIcon: () => null,
}}
/> 
    </Tabs>
  );
}