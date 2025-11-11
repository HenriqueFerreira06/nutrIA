import React from 'react'; // Removido useState, pois o modal saiu
import { View, Text, Image, StyleSheet, Pressable, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

// --- PALETA DE CORES ATUALIZADA ---
const THEME = {
    background: '#F1F1F9',       // Fundo cinza-claro levemente roxo
    textTitle: '#1E1B3A',         // Roxo escuro
    textSubtitle: '#4B5563',     // Cinza médio
    card: '#FFFFFF',             // Branco
    buttonGreen: '#44BC7F',      // Verde do botão "Obter Plano"
    checkIcon: '#ffffffff',        // Cor do ícone de check (Vermelho)
    checkBackground: '#FF373782', // Fundo do check (Vermelho com 51% opacidade)
    trialLink: '#6A6591',        // Cor do link "continuar gratuitamente"
    borderColor: '#F3F4F6',      // Borda interna do card
};
// ----------------------------------

export default function PlanoScreen() {
    const router = useRouter();
    // const [modalVisible, setModalVisible] = useState(false); // REMOVIDO

    const features: string[] = [
        'Criação ilimitada de planos',
        'Relatórios mensais de progresso',
        'Escaneie seus produtos',
        'Conecte-se com seus amigos',
        'Lista de compras inteligente',
        'Ganhe recompensas'
    ];

    // REMOVIDO handleOpenTrialModal
    // REMOVIDO handleTrialAccept

    return (
        <View style={styles.pageContainer}>
            <StatusBar style="dark" />
            <Image
                source={require('@/assets/images/brocolis.png')}
                style={styles.backgroundImage} // Imagem 1 (Superior Esquerda)
                resizeMode="contain"
            />
            {/* --- NOVO: Imagem 2 (Inferior Direita) --- */}
            <Image
                source={require('@/assets/images/brocolis.png')}
                style={styles.backgroundImageBottom}
                resizeMode="contain"
            />

            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>
                            Seu plano alimentar está prontinho!
                        </Text>
                        {/* --- ALTERAÇÃO: Text aninhado para negrito --- */}
                        <Text style={styles.subtitle}>
                            Assine a <Text style={styles.subtitleBold}>Nutria+</Text> para desfrutar de todos os recursos do aplicativo e tenha acesso a planos ilimitados!
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.priceBox}>
                            <Text style={styles.planName}>Nutria+</Text>
                            <View style={styles.priceRow}>
                                <Text style={styles.currency}>R$</Text>
                                <Text style={styles.price}>31,80</Text>
                                <Text style={styles.period}>/mês</Text>
                            </View>
                        </View>

                        <View style={styles.featureList}>
                            {features.map((feature, index) => (
                                <View key={index} style={styles.featureItem}>
                                    {/* --- ALTERAÇÃO: Cores do Check --- */}
                                    <View style={styles.iconCircle}>
                                        <Check size={14} color={THEME.checkIcon} strokeWidth={3} />
                                    </View>
                                    <Text style={styles.featureText}>{feature}</Text>
                                </View>
                            ))}
                        </View>

                        {/* --- ALTERAÇÃO: Cor do Botão --- */}
                        <Pressable style={styles.button}>
                            <Text style={styles.buttonText}>OBTER PLANO</Text>
                        </Pressable>

                        {/* --- ALTERAÇÃO: Texto e Ação do Link --- */}
                        <Pressable style={styles.trialLink} onPress={() => router.push('/TelasVariadas/termosUsoPriv')}>
                            <Text style={styles.trialText}>Ou continuar gratuitamente</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* --- MODAL REMOVIDO --- */}
        </View>
    );
};

// --- ESTILOS ATUALIZADOS ---
const styles = StyleSheet.create({
    pageContainer: {
        flex: 1,
        backgroundColor: THEME.background, // Fundo da tela
    },
    safeArea: {
        flex: 1,
    },
    backgroundImage: { // Brócolis 1 (Superior Esquerdo)
        position: 'absolute',
        top: height * -0.1,
        left: width * -0.4,
        width: width * 1.2,
        height: height * 0.6,
        opacity: 0.15,
        transform: [{ rotate: '30deg' }],
    },
    backgroundImageBottom: { // Brócolis 2 (Inferior Direito)
        position: 'absolute',
        bottom: height * -0.15, // Mais para cima (mais visível)
        right: width * -0.3,   // Mais para a esquerda (mais visível)
        width: width * 1.2,
        height: height * 0.6,
        opacity: 0.15,
        transform: [{ rotate: '-45deg' }],
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32, // AUMENTADO para "achatar" o card
        paddingVertical: 40,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 32,
        maxWidth: '95%', // Ajustado
    },
    title: {
        fontSize: width * 0.08,
        fontFamily: 'Montserrat-Bold',
        color: THEME.textTitle,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: width * 0.1,
    },
    subtitle: {
        fontSize: width * 0.04,
        fontFamily: 'Montserrat-Regular',
        color: THEME.textSubtitle,
        textAlign: 'center',
        lineHeight: 22,
    },
    // --- NOVO: Estilo para o texto em negrito ---
    subtitleBold: {
        fontFamily: 'Montserrat-SemiBold',
        color: THEME.textTitle, // Um pouco mais escuro para destacar
    },
    card: {
        backgroundColor: THEME.card,
        borderRadius: 24,
        padding: 24,
        width: '100%',
        // elevation: 0.5, // REMOVIDO
        // Sem sombras
    },
    priceBox: {
        alignItems: 'flex-start',
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: THEME.borderColor,
        paddingBottom: 24,
    },
    planName: {
        fontSize: width * 0.045,
        fontFamily: 'Montserrat-SemiBold',
        color: THEME.textSubtitle, // Ajustado
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    currency: {
        fontSize: width * 0.05,
        fontFamily: 'Montserrat-Medium',
        color: THEME.textTitle,
        marginRight: 4,
    },
    price: {
        fontSize: width * 0.1,
        fontFamily: 'Montserrat-Bold',
        color: THEME.textTitle,
    },
    period: {
        fontSize: width * 0.04,
        fontFamily: 'Montserrat-Medium',
        color: THEME.textSubtitle,
        marginLeft: 4,
    },
    featureList: {
        marginBottom: 28,
        gap: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: { // Ícone de Check
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: THEME.checkBackground, // Cor com opacidade
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    featureText: {
        fontSize: width * 0.038,
        fontFamily: 'Montserrat-Medium',
        color: THEME.textTitle,
    },
    button: { // Botão "Obter Plano"
        backgroundColor: THEME.buttonGreen, // Cor verde
        borderRadius: 100,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonText: {
        color: '#FFFFFF',
        fontFamily: 'Montserrat-Bold',
        fontSize: width * 0.042,
    },
    trialLink: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    trialText: { // Texto "Ou continuar gratuitamente"
        fontSize: width * 0.035,
        fontFamily: 'Montserrat-SemiBold',
        color: THEME.trialLink,
        textDecorationLine: 'underline',
    },
    
    // --- ESTILOS DO MODAL (Mantidos, mas não são mais usados) ---
    modalBackdrop: {
        flex: 1,
        backgroundColor: THEME.modalBackdrop,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    modalCard: {
        backgroundColor: THEME.card,
        width: '100%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 32,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontFamily: 'Montserrat-Bold',
        color: THEME.textTitle,
        marginBottom: 16,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 16,
        fontFamily: 'Montserrat-Regular',
        color: THEME.textSubtitle,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    modalButton: {
        backgroundColor: THEME.modalButton,
        borderRadius: 100,
        paddingVertical: 16,
        alignItems: 'center',
        width: '100%',
        marginBottom: 16,
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Montserrat-Bold',
    },
    modalLink: {
        fontSize: 14,
        fontFamily: 'Montserrat-SemiBold',
        color: THEME.trialLink,
        textDecorationLine: 'underline',
    },
});