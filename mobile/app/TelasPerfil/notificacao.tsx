import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    Switch,
    LayoutAnimation,
    UIManager,
    Platform,
    ViewStyle, 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';


if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}


const THEME = {
    activeGreen: '#90C256',
    background: '#FFFFFF',
    textPrimary: '#222222',
    textSecondary: '#666666',
    cardBackground: '#FFFFFF',
    borderColor: '#F0F0F0',
    sliderMaxTrack: '#E0E0E0',
    arrowColor: '#4F4F4F',
    headerText: '#FFFFFF',
};

// ===== CORREÇÃO: Adicionada a tipagem para as props do componente =====
interface PreferenceCardProps {
    children: React.ReactNode;
    style?: ViewStyle; // O '?' torna a prop opcional, resolvendo os outros erros
}

// ===== CARD REUTILIZÁVEL COM TIPAGEM =====
const PreferenceCard: React.FC<PreferenceCardProps> = ({ children, style }) => (
    <View style={[styles.card, style]}>{children}</View>
);

// ===== TELA PRINCIPAL =====
export default function NotificacaoScreen() {
    const router = useRouter();

    const [emitirLembretes, setEmitirLembretes] = useState(true);
    const [emitirSons, setEmitirSons] = useState(true);
    const [emitirVibracao, setEmitirVibracao] = useState(true);

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Topo com imagem verde invertida */}
            <View style={styles.headerContainer}>
                <Image
                    source={require('../../assets/images/grupoverde.png')}
                    style={styles.backgroundImage}
                />
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <MaterialIcons name="arrow-back" size={24} color={THEME.headerText} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notificações</Text>
                </View>
            </View>

            {/* Conteúdo */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Emitir lembretes */}
                <PreferenceCard>
                    <Text style={styles.cardText}>Emitir lembretes</Text>
                    <Switch
                        trackColor={{ false: THEME.sliderMaxTrack, true: THEME.activeGreen }}
                        thumbColor={THEME.background}
                        value={emitirLembretes}
                        onValueChange={setEmitirLembretes}
                    />
                </PreferenceCard>

                {/* Emitir sons */}
                <PreferenceCard>
                    <Text style={styles.cardText}>Emitir sons</Text>
                    <Switch
                        trackColor={{ false: THEME.sliderMaxTrack, true: THEME.activeGreen }}
                        thumbColor={THEME.background}
                        value={emitirSons}
                        onValueChange={setEmitirSons}
                    />
                </PreferenceCard>

                {/* Emitir vibração */}
                <PreferenceCard>
                    <Text style={styles.cardText}>Emitir vibração</Text>
                    <Switch
                        trackColor={{ false: THEME.sliderMaxTrack, true: THEME.activeGreen }}
                        thumbColor={THEME.background}
                        value={emitirVibracao}
                        onValueChange={setEmitirVibracao}
                    />
                </PreferenceCard>
            </ScrollView>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: THEME.background, 
    },
    headerContainer: {
        height: 180, 
        justifyContent: 'center',
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        resizeMode: 'cover',
        top: -50,
        left: -25,
        height: 300,
        width: 500,
        transform: [{ scaleY: -1 }],
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 20, 
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: THEME.headerText,
        marginLeft: 15,
    },
    scrollView: {
        flex: 1,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        marginTop: -40, 
    },
    scrollViewContent: {
        padding: 20,
    },
    card: {
        backgroundColor: THEME.cardBackground,
        borderRadius: 15,
        paddingVertical: 10,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 3,
    },
    cardText: {
        fontSize: 16,
        fontWeight: '500',
        color: THEME.textPrimary,
    },
    languagePickerContainer: {
        backgroundColor: THEME.cardBackground,
        borderRadius: 15,
        marginTop: -10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 3,
    },
    languageOption: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: THEME.borderColor,
    },
    languageText: {
        fontSize: 16,
        color: THEME.textSecondary,
    },
    selectedLanguageText: {
        color: THEME.activeGreen,
        fontWeight: 'bold',
    },
});