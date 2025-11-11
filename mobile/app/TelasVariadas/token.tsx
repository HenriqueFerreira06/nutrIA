import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Cores baseadas na sua imagem de referência
const COLORS = {
    backgroundDark: '#2C0637', // Roxo escuro do header
    backgroundLight: '#533C64', // Roxo claro do corpo
    greenAccent: '#44BC7F', // Verde do banner e da "Nutria+"
    cardPurple: '#533C64', // Roxo dos cards (pode variar ligeiramente)
    cardGradientStart: '#8A2BE2', // Roxo escuro para gradientes dos cards
    cardGradientEnd: '#4B0082',   // Outro roxo para gradientes
    tokenGradientStart: '#FFD700', // Dourado do token
    tokenGradientEnd: '#FFA500',   // Laranja do token
    white: '#FFFFFF',
    textLightGray: '#D3D3D3',
    textDarkGray: '#A9A9A9',
};

// Componente para um único Token Card
const TokenCard = ({ tokens, price, description, gradientColors, imageSource }: any) => {
    return (
        <View style={[styles.cardContainer, { backgroundColor: COLORS.cardPurple }]}>
            <Image source={imageSource} style={styles.tokenImage} resizeMode="contain" />
            <Text style={styles.cardTokensText}>{tokens} TOKENS</Text>
            <View style={[styles.priceButton, { backgroundColor: gradientColors.start }]}>
                <Text style={styles.priceButtonText}>Por R${price}</Text>
            </View>
            <Text style={styles.cardDescriptionText}>{description}</Text>
        </View>
    );
};

export default function BuyTokensScreen() {
    const router = useRouter();

    return (
        <View style={styles.fullContainer}>
            {/* Configuração do Header */}
            <Stack.Screen
                options={{
                    headerShown: false, // Desabilitar o header padrão para criar um customizado
                }}
            />

            {/* Custom Header */}
            <View style={styles.customHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Comprar Tokens</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Descrição Principal */}
                <Text style={styles.mainDescription}>
                    Quer editar seu plano sem precisar assinar a <Text style={{ color: COLORS.greenAccent }}>Nutria+?</Text> Compre Tokens.
                </Text>

                {/* Banner de "1 Token = 1 edição" */}
                <View style={styles.banner}>
                    <Text style={styles.bannerText}>1 Token = 1 edição no seu plano</Text>
                </View>

                {/* Cards de Tokens */}
                <View style={styles.cardsGrid}>
                    <TokenCard
                        tokens={1}
                        price={10}
                        description="Você pode fazer 1 alteração no plano"
                        gradientColors={{ start: COLORS.tokenGradientStart, end: COLORS.tokenGradientEnd }}
                        imageSource={require('@/assets/images/karucoin.png')} // Substitua pelo caminho real da imagem do token
                    />
                    <TokenCard
                        tokens={3}
                        price={26}
                        description="Você pode fazer 3 alterações no plano"
                        gradientColors={{ start: COLORS.tokenGradientStart, end: COLORS.tokenGradientEnd }}
                        imageSource={require('@/assets/images/karucoin.png')} // Substitua pelo caminho real da imagem dos 3 tokens
                    />
                </View>

                {/* Card de 10 Tokens (separado para o layout vertical) */}
                <View style={styles.singleCardRow}>
                    <TokenCard
                        tokens={10}
                        price={90}
                        description="Você pode fazer 10 alterações no plano"
                        gradientColors={{ start: COLORS.tokenGradientStart, end: COLORS.tokenGradientEnd }}
                        imageSource={require('@/assets/images/karucoin.png')} // Substitua pelo caminho real da imagem dos 10 tokens
                    />
                </View>

                {/* Imagens de fundo dos tokens (ajuste o caminho se necessário) */}
                <Image source={require('@/assets/images/karucoin.png')} style={styles.bgToken1} />
                <Image source={require('@/assets/images/karucoin.png')} style={styles.bgToken2} />
                <Image source={require('@/assets/images/karucoin.png')} style={styles.bgToken3} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    fullContainer: {
        flex: 1,
        backgroundColor: COLORS.backgroundDark, // Fundo escuro total
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50, // Ajuste para descer da barra de status
        paddingBottom: 20,
        backgroundColor: COLORS.backgroundDark,
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.white,
        fontFamily: 'Poppins-SemiBold', // Supondo que você usa Poppins
    },
    scrollContent: {
        flexGrow: 1,
        backgroundColor: COLORS.backgroundLight, // Fundo roxo mais claro abaixo do header
        paddingHorizontal: 20,
        paddingBottom: 40,
        position: 'relative',
    },
    mainDescription: {
        fontSize: 16,
        color: COLORS.textLightGray,
        textAlign: 'center',
        marginBottom: 25,
        marginTop: 20,
        lineHeight: 24,
        fontFamily: 'Poppins-Regular',
    },
    banner: {
        backgroundColor: COLORS.greenAccent,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        // Sombra para dar destaque
        shadowColor: COLORS.greenAccent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    bannerText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.white,
        fontFamily: 'Poppins-SemiBold',
    },
    cardsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap', // Permite quebrar linha se necessário
        marginBottom: 20,
    },
    singleCardRow: {
        alignItems: 'center', // Centraliza o card de 10 tokens
    },
    cardContainer: {
        width: (width - 60) / 2, // 20 de padding * 2 + 20 de espaçamento entre cards
        borderRadius: 20,
        padding: 15,
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: COLORS.cardPurple, // Cor de fundo do card
        // Sombra dos cards
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
    },
    tokenImage: {
        width: width * 0.2, // Ajuste o tamanho da imagem do token
        height: width * 0.2,
        marginBottom: 10,
    },
    cardTokensText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 10,
        fontFamily: 'Poppins-Bold',
    },
    priceButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginBottom: 10,
        // Sombra leve para o botão de preço
        shadowColor: COLORS.tokenGradientStart,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 4,
    },
    priceButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.backgroundDark, // Cor do texto, escuro para contraste
        fontFamily: 'Poppins-SemiBold',
    },
    cardDescriptionText: {
        fontSize: 12,
        color: COLORS.textDarkGray,
        textAlign: 'center',
        lineHeight: 18,
        fontFamily: 'Poppins-Regular',
    },
    // Tokens de fundo
    bgToken1: {
        position: 'absolute',
        width: 150,
        height: 150,
        top: '15%',
        left: -50,
        opacity: 0.1,
        transform: [{ rotate: '20deg' }],
        zIndex: -1,
    },
    bgToken2: {
        position: 'absolute',
        width: 100,
        height: 100,
        bottom: '10%',
        right: -30,
        opacity: 0.1,
        transform: [{ rotate: '-30deg' }],
        zIndex: -1,
    },
    bgToken3: {
        position: 'absolute',
        width: 80,
        height: 80,
        top: '60%',
        left: '40%',
        opacity: 0.08,
        transform: [{ rotate: '50deg' }],
        zIndex: -1,
    },
});