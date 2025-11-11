// app/TelasCadastroLogin/welcome.tsx
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebaseConfig';
import { useAuth } from '../../context/AuthContext'; // Importe o useAuth

const { width, height } = Dimensions.get('window');

// --- Funções Auxiliares (mantidas) ---
const getInitials = (nome?: string, sobrenome?: string): string => {
    const n = nome ? nome[0] : '';
    const s = sobrenome ? sobrenome[0] : '';
    return `${n}${s}`.toUpperCase();
};

const maskEmail = (email?: string | null): string => {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const [user, domain] = parts;
    if (user.length <= 2) return email;
    const maskedUser = `${user[0]}${'*'.repeat(user.length - 2)}${user[user.length - 1]}`;
    return `${maskedUser}@${domain}`;
};
// -------------------------

export default function WelcomeScreen() {
    const router = useRouter();
    const { login, isLoading, user: lastUser, clearLastUserAndLogout } = useAuth(); // Obtenha 'login' e 'isLoading' do contexto
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoginLoading, setIsLoginLoading] = useState(false);

    // O useEffect que lia o AsyncStorage foi removido (agora é feito pelo AuthProvider)

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const handleLogin = async () => {
        if (!lastUser || !password) {
            Alert.alert("Erro", "Senha não inserida.");
            return;
        }
        if (!lastUser.email) {
             Alert.alert("Erro", "Não foi possível encontrar o e-mail do último usuário.");
             await clearLastUserAndLogout();
             return;
        }

        setIsLoginLoading(true);
        try {
            const userCredential = await auth.signInWithEmailAndPassword(lastUser.email, password);
            const firebaseUser = userCredential.user;
            
            if (!firebaseUser) throw new Error('Usuário não encontrado.');

            // Prepara os dados para o contexto (usa os que já temos do lastUser)
            const userDataForContext = {
                uid: firebaseUser.uid,
                nome: lastUser.nome,
                sobrenome: lastUser.sobrenome,
                email: firebaseUser.email,
            };
            
            await login(userDataForContext); // Chama o login do contexto
            // O AuthGuard cuidará do redirecionamento

        } catch (error: any) {
            const errorCode = error.code;
            console.log("CÓDIGO DE ERRO DO LOGIN:", errorCode); 

            if (['auth/user-not-found', 'auth/invalid-credential', 'auth/user-disabled', 'auth/invalid-email'].includes(errorCode)) {
                Alert.alert(
                    'Usuário Inválido',
                    'Esta conta não foi encontrada ou foi desativada. Limpando dados locais...'
                );
                await clearLastUserAndLogout(); // Limpa o usuário inválido
            } 
            else if (errorCode === 'auth/wrong-password') {
                Alert.alert('Erro', 'Senha incorreta.');
            } 
            else {
                Alert.alert('Erro ao logar', `Ocorreu um erro inesperado: ${errorCode}`);
            }
        } finally {
            setIsLoginLoading(false);
        }
    };

    const handleForgotPassword = () => {
        router.push({
             pathname: '/TelasCadastroLogin/esqueciSenha',
             params: { email: lastUser?.email || '' } 
        });
    };

    const handleNavigateToRegister = () => {
        console.log('Botão "Trocar ou criar conta" clicado. Navegando para cadastro SEM limpar @lastUser.');
        // Apenas navega, não limpa mais o AsyncStorage
        router.push('/TelasCadastroLogin/cadastro');
    };


    if (isLoading) {
        return (
            <View style={[styles.outerContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#44BC7F" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.outerContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header Visual */}
                <View style={styles.headerBackgroundContainer}>
                    <Image
                        source={require('@/assets/images/fundowc.png')}
                        style={styles.headerBackgroundImage}
                        resizeMode="stretch"
                    />
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('@/assets/images/nutria.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.slogan}>Sua nutrição, mais inteligente. </Text>
                    </View>
                </View>

                {/* Conteúdo do Formulário (Condicional) */}
                <View style={styles.formContainer}>

                    {lastUser ? (
                        // ----- VIEW SE TEM USUÁRIO SALVO -----
                        <>
                            <View style={styles.userCard}>
                                <View style={styles.userInitialsCircle}>
                                    <Text style={styles.userInitialsText}>{lastUser.iniciais || getInitials(lastUser.nome, lastUser.sobrenome)}</Text>
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={styles.userName}>{`${lastUser.nome} ${lastUser.sobrenome || ''}`.trim()}</Text>
                                    <Text style={styles.userEmail}>{maskEmail(lastUser.email)}</Text>
                                </View>
                            </View>
                            
                            <Text style={styles.inputLabel}>Senha</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Digite sua senha"
                                    placeholderTextColor="#A0AEC0"
                                    secureTextEntry={!isPasswordVisible}
                                    value={password}
                                    onChangeText={setPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
                                    <Ionicons
                                        name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                                        size={24}
                                        color="#A0AEC0"
                                    />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleLogin}
                                disabled={isLoginLoading}
                            >
                                {isLoginLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Entrar</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={handleForgotPassword}
                            >
                                <Text style={styles.secondaryButtonText}>Não sei minha senha</Text>
                            </TouchableOpacity>
                                
                            <View style={styles.switchAccountContainer}>
                                <TouchableOpacity onPress={handleNavigateToRegister}> 
                                    <Text style={styles.switchAccountText}>Trocar ou criar conta</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        // ----- VIEW SE NÃO TEM USUÁRIO SALVO (CORRIGIDA) -----
                        <>
                            {/* --- CORREÇÃO 1: Usar o card verde (styles.userCard) com o conteúdo da imagem --- */}
                            <View style={styles.userCard}>
                                <View style={styles.userInitialsCircle}>
                                    <Text style={styles.userInitialsText}>N/A</Text>
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={styles.userName}>Sem registro</Text>
                                    <Text style={styles.userEmail}>Esperando o que? Faça parte dessa comunidade!</Text>
                                </View>
                            </View>

                            {/* --- CORREÇÃO 2: Usar apenas o botão secundário (outlined) --- */}
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                // Navega para a nova tela de cadastro/login
                                onPress={() => router.push('/TelasCadastroLogin/cadastro')}
                            >
                                <Text style={styles.secondaryButtonText}>Entrar ou criar conta</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* --- CORREÇÃO 3: Adicionar o rodapé --- */}
                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>Nutr.IA - Gerador de plano alimentar</Text>
                    <Text style={styles.footerText}>Versão 1.0</Text>
                    <Text style={styles.footerText}>2025 Nutr.IA, ltd.</Text>
                </View>
                
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// Estilos
const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: '#EDEDED',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    headerBackgroundContainer: {
        height: height * 0.4,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    headerBackgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
    },
    logoContainer: {
        alignItems: 'center',
        zIndex: 10,
    },
    logo: {
        width: width * 0.5,
        height: height * 0.1,
        marginBottom: -10,
    },
    slogan: {
        fontSize: 16,
        marginLeft: 12.5,
        color: '#fff',
        fontFamily: 'Montserrat-Regular',
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: 26,
        paddingTop: 40,
        paddingBottom: 40,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#44BC7F',
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    userInitialsCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#38A169',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    userInitialsText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'Montserrat-Bold',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Montserrat-SemiBold',
        marginBottom: 2,
    },
    userEmail: {
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: 'Montserrat-SemiBold',
    },
    inputLabel: {
        fontSize: 14,
        color: '#120D37',
        fontFamily: 'Poppins-Regular',
        marginBottom: 0,
        marginLeft: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EDEDED',
        marginBottom: 25,
        paddingHorizontal: 15,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#2D3748',
        fontFamily: 'Montserrat-Regular',
    },
    eyeIcon: {
        padding: 5,
    },
    primaryButton: {
        backgroundColor: '#44BC7F',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 10,
        minHeight: 50,
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Montserrat-Bold',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        // --- CORREÇÃO: Removido o marginBottom: 40 para ficar mais parecido com a imagem ---
        marginBottom: 20, 
        borderWidth: 1.5,
        borderColor: '#44BC7F',
    },
    secondaryButtonText: {
        color: '#44BC7F',
        fontSize: 16,
        fontFamily: 'Montserrat-SemiBold',
    },
    switchAccountContainer: {
        alignItems: 'flex-end',
        paddingRight: 5,
    },
    switchAccountText: {
        color: '#120D37',
        fontSize: 14,
        fontFamily: 'Montserrat-SemiBold',
        textDecorationLine: 'none',
        marginTop: 120,
    },
    // O noUserCard não é mais usado na lógica corrigida, mas mantido aqui
    noUserCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        marginBottom: 25,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    noUserText: {
        fontSize: 18,
        fontFamily: 'Montserrat-Bold',
        color: '#120D37',
        marginBottom: 5,
    },
    noUserSubText: {
        fontSize: 14,
        fontFamily: 'Montserrat-Regular',
        color: '#2D3748',
        textAlign: 'center',
    },

    // --- CORREÇÃO 4: Adicionar estilos do rodapé ---
    footerContainer: {
        padding: 20,
        alignItems: 'center',
        paddingBottom: 30, // Garante espaço na base
    },
    footerText: {
        fontSize: 12,
        fontFamily: 'Montserrat-Regular',
        color: '#A0AEC0', // Um cinza claro, como no print
        marginBottom: 2,
    },
});