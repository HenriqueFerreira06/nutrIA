import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, Image, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { auth, db } from '../firebaseConfig'; 
import { useAuth } from '../../context/AuthContext'; 

const { width, height } = Dimensions.get('window');

const termsContent = [
    {
        title: '1. Exclusividade dos Planos Alimentares',
        text: 'Os planos alimentares disponibilizados no aplicativo são de uso pessoal e intransferível. O usuário não deve compartilhar, reproduzir, distribuir ou disponibilizar esses conteúdos em quaisquer meios, sob pena de violação dos direitos autorais e de uso exclusivo do serviço.'
    },
    {
        title: '2. Responsabilidade do Usuário',
        text: 'O usuário é responsável por fornecer informações corretas e atualizadas ao utilizar o aplicativo, especialmente em relação às suas condições de saúde, preferências alimentares e restrições, a fim de garantir a eficácia e a personalização dos planos.'
    },
    {
        title: '3. Cancelamento da Assinatura',
        text: 'O usuário poderá cancelar sua assinatura a qualquer momento por meio da área de gerenciamento do aplicativo. O cancelamento não gera reembolso proporcional ao período não utilizado, mas garante a interrupção da renovação automática a partir do próximo ciclo de cobrança.'
    },
    {
        title: '4. Limitação de Responsabilidade',
        text: 'O aplicativo não substitui acompanhamento médico ou nutricional profissional. Todas as informações disponibilizadas têm caráter informativo e de apoio, não devendo ser interpretadas como prescrição médica.'
    },
    {
        title: '5. Alterações nos Termos e Serviços',
        text: 'O aplicativo reserva-se o direito de alterar, atualizar ou modificar estes Termos de Uso e Condições a qualquer momento, noticiando os usuários por meio da própria plataforma ou do e-mail cadastrado. A continuidade do uso após a alteração implica concordância com os novos termos.'
    },
];

export default function TermosScreen() {
    const router = useRouter();
    const { forceUpdateOnboardingStatus } = useAuth(); 

    const handleAccept = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            Alert.alert("Erro", "Você não está autenticado. Por favor, reinicie o aplicativo.");
            router.replace('/TelasCadastroLogin/welcome');
            return;
        }

        try {
            const userDocRef = db.collection("users").doc(currentUser.uid);
            await userDocRef.set({
                onboardingComplete: true
            }, { merge: true });

            console.log("Termos: Onboarding marcado como completo no Firestore.");

            
            forceUpdateOnboardingStatus(true);
            console.log("Termos: Estado de onboarding no contexto atualizado para true.");
            

            router.replace('/(TelasAbas)/home');

        } catch (error) {
            console.error("Erro ao atualizar onboardingComplete:", error);
            Alert.alert("Erro", "Não foi possível salvar sua aceitação. Tente novamente.");
        }
    };

    return (
        <View style={styles.pageContainer}>
            <StatusBar style="dark" />
            <Image
                source={require('@/assets/images/brocolis.png')}
                style={styles.backgroundImage}
                resizeMode="contain"
            />
            <Image
                source={require('@/assets/images/brocolis.png')}
                style={styles.backgroundImage2}
                resizeMode="contain"
            />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>Termos de Uso e Condições</Text>
                            <View style={styles.titleUnderline} />
                        </View>

                        <Text style={styles.subtitle}>
                            Para utilizar a Nutr.IA, você precisa ler e concordar com os itens abaixo
                        </Text>

                        {termsContent.map((item, index) => (
                            <View key={index} style={styles.sectionContainer}>
                                <Text style={styles.sectionTitle}>{item.title}</Text>
                                <Text style={styles.sectionText}>{item.text}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    <Pressable style={styles.button} onPress={handleAccept}>
                        <Text style={styles.buttonText}>Concordo</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    pageContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    safeArea: {
        flex: 1,
    },
    backgroundImage: {
        position: 'absolute',
        width: width * 1.2,
        height: height * 0.6,
        top: height * -0.1,
        left: width * -0.4,
        opacity: 0.15,
    },

    backgroundImage2: {
        position: 'absolute',
        width: width * 1.2,
        height: height * 0.6,
        top: height * 0.5,
        left: width * 0.3,
        opacity: 0.15,
        transform: [{ rotate: '-65deg' }],
    },

    container: {
        flex: 1,
        justifyContent: 'space-between',
        paddingTop: 40,
    },
    scrollContainer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: width * 0.075,
        fontFamily: 'Montserrat-Bold',
        color: '#1E1B3A',
        textAlign: 'center',
    },
    titleUnderline: {
        height: 4,
        width: 80,
        backgroundColor: '#1E1B3A',
        borderRadius: 2,
        marginTop: 8,
    },
    subtitle: {
        fontSize: width * 0.04,
        fontFamily: 'Montserrat-Regular',
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 40,
        paddingHorizontal: 16,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: width * 0.045,
        fontFamily: 'Montserrat-Bold',
        color: '#1E1B3A',
        marginBottom: 8,
    },
    sectionText: {
        fontSize: width * 0.038,
        fontFamily: 'Montserrat-Regular',
        color: '#4B5563',
        lineHeight: 22,
    },
    button: {
        backgroundColor: '#1B0C45',
        borderRadius: 100,
        paddingVertical: 18,
        alignItems: 'center',
        marginHorizontal: 24,
        marginBottom: 20,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: width * 0.045,
        fontFamily: 'Montserrat-Bold',
    },
});