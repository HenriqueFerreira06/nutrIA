import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const THEME = { green: '#44BC7F', bg: '#EDEDED', white: '#ffffff', gray700: '#1B0C45', gray500: '#BFBEBF', initialsBg: '#E0E0E0' };

const getInitials = (name: string) => {
    if (!name || name === 'Carregando...') return '...';
    const names = name.split(' ');
    const firstInitial = names[0] ? names[0][0] : '';
    const lastInitial = names.length > 1 ? names[names.length - 1][0] : '';
    return (firstInitial + lastInitial).toUpperCase();
};

type MenuItemProps = { icon: React.ComponentProps<typeof MaterialIcons>['name']; text: string; onPress: () => void; isLast?: boolean; };
type MenuItemData = { icon: React.ComponentProps<typeof MaterialIcons>['name']; text: string; action: string | (() => void); };

const MenuItem: React.FC<MenuItemProps> = ({ icon, text, onPress, isLast }) => (
    <TouchableOpacity style={[styles.menuItem, isLast && styles.menuItemLast]} onPress={onPress}>
        <MaterialIcons name={icon} size={32} color={THEME.gray700} style={styles.menuIcon} />
        <Text style={styles.menuText}>{text}</Text>
        <MaterialIcons name="chevron-right" size={24} color={THEME.gray500} />
    </TouchableOpacity>
);

export default function PerfilScreen() {
    const router = useRouter();
    const { user, logout, isLoading } = useAuth();
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        Alert.alert("Confirmar Saída", "Tem certeza que deseja sair?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Sair", style: "destructive", onPress: async () => { setLoggingOut(true); try { await logout(); } catch (error) { Alert.alert('Erro', 'Não foi possível sair.'); setLoggingOut(false); } } },
        ]);
    };

    const handlePress = (action: string | (() => void)) => {
        if (typeof action === 'string') { if (action) router.push(action as any); } else if (typeof action === 'function') { action(); }
    };

    const openInstagramProfile = () => {
        const username = 'nutr.ia__';
        Linking.openURL(`https://www.instagram.com/${username}/`);
    };

    const menuItems: MenuItemData[] = [
        { icon: 'person-outline', text: 'Editar perfil', action: '/TelasPerfil/editar' },
        { icon: 'edit', text: 'Meu plano alimentar', action: '/TelasPerfil/plano' },
        { icon: 'settings', text: 'Preferências', action: '/TelasPerfil/config' },
        { icon: 'notifications-none', text: 'Notificações', action: '/TelasPerfil/notificacao' },
        { icon: 'credit-card', text: 'Assinatura', action: '/TelasPerfil/assinatura' },
        { icon: 'lock-outline', text: 'Privacidade', action: '/TelasPerfil/privacidade' },
        { icon: 'help-outline', text: 'Ajuda', action: openInstagramProfile },
        { icon: 'logout', text: 'Sair', action: handleLogout },
    ];

    const displayName = user ? `${user.nome} ${user.sobrenome || ''}`.trim() : 'Carregando...';
    const userInitials = getInitials(displayName);

    if (isLoading && !user && !loggingOut) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={THEME.green} /></View>;
    if (loggingOut) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={THEME.green} /></View>;
    if (!user && !isLoading) return <View style={styles.loadingContainer}><Text>Usuário não encontrado.</Text></View>;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.greenBackgroundLayer}>
                    <Image source={require('../../assets/images/ellipse3.png')} style={styles.headerEllipse1} />
                    <Image source={require('../../assets/images/ellipse3.png')} style={styles.headerEllipse2} />
                    <Image source={require('../../assets/images/ellipse3.png')} style={styles.headerEllipse3} />
                </View>
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    <View style={styles.profileHeader}>
                        <View style={styles.initialsContainer}>
                            <Text style={styles.initialsText}>{userInitials}</Text>
                        </View>
                        <Text style={styles.profileName}>{displayName}</Text>
                    </View>
                    <View style={styles.menuContainer}>
                        {menuItems.map((item, index) => (
                            <MenuItem key={item.text} icon={item.icon} text={item.text} onPress={() => handlePress(item.action)} isLast={index === menuItems.length - 1} />
                        ))}
                    </View>
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Nutr.IA - Gerador de plano alimentar</Text>
                        <Text style={styles.footerText}>Versão 1.0</Text>
                        <Text style={styles.footerText}>2025 Nutr.IA, ltd.</Text>
                        <View style={styles.footerLinks}>
                            <TouchableOpacity onPress={() => handlePress('/TelasVariadas/termosUsoPriv')}>
                                <Text style={styles.footerLinkText}>Política de privacidade</Text>
                            </TouchableOpacity>
                            <Text style={styles.footerLinkText}> • </Text>
                            <TouchableOpacity onPress={() => handlePress('/TelasVariadas/termosUsoPriv')}>
                                <Text style={styles.footerLinkText}>Termos de Uso</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: THEME.bg },
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.bg },
    greenBackgroundLayer: { backgroundColor: THEME.green, position: 'absolute', top: 0, left: 0, right: 0, height: 260, overflow: 'hidden' },
    headerEllipse1: { position: 'absolute', top: -40, right: 150, width: 240, height: 240, resizeMode: 'contain', opacity: 1 },
    headerEllipse2: { position: 'absolute', top: 120, left: -80, width: 220, height: 220, resizeMode: 'contain', opacity: 1 },
    headerEllipse3: { position: 'absolute', top: 80, left: 180, width: 250, height: 250, resizeMode: 'contain', opacity: 1 },
    scrollViewContent: { paddingBottom: 20 },
    profileHeader: { alignItems: 'center', paddingTop: 40, paddingBottom: 80 },
    initialsContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#ffffffff", justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 3, borderColor: "#000000ff" },
    initialsText: { fontSize: 40, color: THEME.gray700, fontWeight: 'bold' },
    profileName: { fontSize: 22, fontWeight: 'bold', color: THEME.white },
    menuContainer: { backgroundColor: THEME.white, marginHorizontal: 16, borderRadius: 15, paddingVertical: 10, marginTop: -60, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
    menuItemLast: { borderBottomWidth: 0 },
    menuIcon: { marginRight: 15 },
    menuText: { flex: 1, fontSize: 16, color: THEME.gray700, fontFamily: 'Poppins-Medium' },
    footer: { alignItems: 'center', marginTop: 30, paddingBottom: 20 },
    footerText: { fontSize: 12, color: THEME.gray500, marginBottom: 4 },
    footerLinks: { flexDirection: 'row', marginTop: 10 },
    footerLinkText: { fontSize: 12, color: "#44BC7F", fontWeight: 'bold' },
});