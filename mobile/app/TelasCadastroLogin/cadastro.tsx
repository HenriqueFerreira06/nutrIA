// app/TelasCadastroLogin/cadastro.tsx
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
    Alert, Dimensions, Image, Platform, Animated, StyleSheet, Text,
    TextInput, TouchableOpacity, View, ActivityIndicator,
    ScrollView, KeyboardAvoidingView, UIManager
    // ImageBackground removido
} from 'react-native';
import { auth, db } from '../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
// --- ALTERAÇÃO INÍCIO: Garantir que Ionicons está importado (já estava) ---
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
// --- ALTERAÇÃO FIM ---

const { width, height } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Componentes LoginForm (IDÊNTICO, SEM ALTERAÇÕES) ---
const LoginForm = () => {
    // [SEU CÓDIGO DO LOGINFORM IDÊNTICO AQUI]
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) return Alert.alert('Erro', 'Por favor, preencha e-mail e senha.');
        setLoading(true);
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const firebaseUser = userCredential.user;
            if (!firebaseUser) throw new Error('Usuário não encontrado.');

            const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
            let userDataForContext: { uid: string; nome: string; sobrenome?: string; email: string | null; };

            if (userDoc.exists) {
                const userData = userDoc.data();
                userDataForContext = {
                    uid: firebaseUser.uid,
                    nome: userData?.nome || 'Usuário',
                    sobrenome: userData?.sobrenome || '',
                    email: firebaseUser.email,
                };
            } else {
                userDataForContext = { uid: firebaseUser.uid, nome: 'Usuário', sobrenome: '', email: firebaseUser.email };
            }

            await login(userDataForContext);
            console.log("Login OK, AuthGuard assume...");

        } catch (error: any) {
            if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-email'].includes(error.code)) {
                Alert.alert('Erro', 'E-mail ou senha incorretos.');
            } else {
                 Alert.alert('Erro ao logar', `Ocorreu um erro inesperado: ${error.message || error.code}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="rgba(0,0,0,0.4)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
            <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="rgba(0,0,0,0.4)" value={password} onChangeText={setPassword} secureTextEntry/>
            <TouchableOpacity style={styles.botao} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.botaoTexto}>Entrar</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/TelasCadastroLogin/esqueciSenha')} style={{ marginTop: 15 }}>
                <Text style={styles.linkText}>Esqueceu a senha?</Text>
            </TouchableOpacity>
        </>
    );
};

// --- Componente RegisterForm (COM ALTERAÇÕES) ---
const RegisterForm = () => {
    // [CÓDIGO DO REGISTERFORM COM ALTERAÇÕES]
    const { login } = useAuth();
    const [usuario, setUsuario] = useState('');
    const [sobrenome, setSobrenome] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [loading, setLoading] = useState(false);
    const [aceitouTermos, setAceitouTermos] = useState(false);
    const router = useRouter();

    // --- ALTERAÇÃO INÍCIO: Estados para visibilidade da senha ---
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    // --- ALTERAÇÃO FIM ---


    const handleCadastro = async () => {
        if (senha !== confirmarSenha) return Alert.alert('', 'As senhas não coincidem.');
        if (!usuario || !sobrenome || !email || !dataNascimento || !senha) return Alert.alert('', 'Preencha todos os campos obrigatórios.');
        if (!aceitouTermos) return Alert.alert('Aviso', 'Você precisa aceitar os Termos de Uso para continuar.');
        setLoading(true);
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, senha);
            const firebaseUser = userCredential.user;
            if (!firebaseUser) throw new Error('Falha ao criar usuário no Firebase Auth.');

            const userDataForFirestore = {
                uid: firebaseUser.uid, nome: usuario, sobrenome, dataNascimento,
                email: email.toLowerCase(), createdAt: new Date(), onboardingComplete: false,
            };

            await db.collection('users').doc(firebaseUser.uid).set(userDataForFirestore);

            const userDataForContext = {
                uid: firebaseUser.uid, nome: usuario, sobrenome: sobrenome, email: email.toLowerCase(),
            };
            
            await login(userDataForContext);
            console.log("Cadastro: Usuário logado. AuthGuard deve redirecionar.");

        } catch (error: any) {
            console.error("Erro no cadastro:", error);
            if (error.code === 'auth/email-already-in-use') Alert.alert('Erro', 'Este e-mail já está em uso.');
            else if (error.code === 'auth/weak-password') Alert.alert('Erro', 'A senha deve ter no mínimo 6 caracteres.');
            else Alert.alert('Erro ao criar conta', `Ocorreu um erro inesperado: ${error.message || error.code}`);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      return `${d}/${m}/${date.getFullYear()}`;
    };
    
    const onDateChange = (event: DateTimePickerEvent, dateValue?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (event.type === 'set' && dateValue) {
            const currentDate = dateValue || new Date();
            setSelectedDate(currentDate);
            setDataNascimento(formatDate(currentDate));
        }
    };

    return (
        <>
            <TextInput style={styles.input} placeholder="Nome" placeholderTextColor="rgba(0,0,0,0.4)" value={usuario} onChangeText={setUsuario} />
            <TextInput style={styles.input} placeholder="Sobrenome" placeholderTextColor="rgba(0,0,0,0.4)" value={sobrenome} onChangeText={setSobrenome} />
            
            {/* O styles.input agora tem 'justifyContent: center' (definido no StyleSheet) */}
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text style={{color: selectedDate ? '#000' : 'rgba(0,0,0,0.4)', fontSize: 16, fontFamily: 'Montserrat-Regular'}}>
                {selectedDate ? formatDate(selectedDate) : 'Data de nascimento'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker value={selectedDate || new Date(2000,0,1)} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()} onChange={onDateChange}/>
            )}

            <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="rgba(0,0,0,0.4)" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            
            {/* --- ALTERAÇÃO INÍCIO: Inputs de Senha com Ícone --- */}
            
            {/* Container da Senha */}
            <View style={styles.passwordInputWrapper}>
                <TextInput
                    style={[styles.input, { marginVertical: 0 }]} // Remove a margem vertical do input
                    placeholder="Senha"
                    placeholderTextColor="rgba(0,0,0,0.4)"
                    secureTextEntry={!isPasswordVisible} // Controlado pelo estado
                    value={senha}
                    onChangeText={setSenha}
                />
                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                    <Ionicons
                        name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                        size={24}
                        color="#A0AEC0"
                    />
                </TouchableOpacity>
            </View>

            {/* Container da Confirmação de Senha */}
            <View style={styles.passwordInputWrapper}>
                <TextInput
                    style={[styles.input, { marginVertical: 0 }]} // Remove a margem vertical do input
                    placeholder="Confirmar senha"
                    placeholderTextColor="rgba(0,0,0,0.4)"
                    secureTextEntry={!isConfirmPasswordVisible} // Controlado pelo estado
                    value={confirmarSenha}
                    onChangeText={setConfirmarSenha}
                />
                <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} style={styles.eyeIcon}>
                    <Ionicons
                        name={isConfirmPasswordVisible ? "eye-off-outline" : "eye-outline"}
                        size={24}
                        color="#A0AEC0"
                    />
                </TouchableOpacity>
            </View>
            {/* --- ALTERAÇÃO FIM --- */}

            
            <View style={styles.termosContainer}>
              <TouchableOpacity style={[styles.checkbox, aceitouTermos && styles.checkboxMarcado]} onPress={()=>setAceitouTermos(!aceitouTermos)}>
                {aceitouTermos && <Text style={styles.checkText}>✓</Text>}
              </TouchableOpacity>
              <Text style={styles.termosTexto}>
                Ao continuar, você concorda com nossos{' '}
                <Text style={styles.linkTermos} onPress={()=>router.push('/TelasVariadas/termosUsoPriv')}>
                  Termos de Uso e Condições
                </Text>
              </Text>
            </View>

            <TouchableOpacity style={styles.botao} onPress={handleCadastro} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.botaoTexto}>Cadastrar</Text>}
            </TouchableOpacity>
        </>
    );
};
// -----------------------------------------------------------------------


// Componente animado para os inputs (fade in) (Sem alterações)
const AnimatedFormView = ({ children }: { children: React.ReactNode }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            delay: 100,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    return (
        <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>
            {children}
        </Animated.View>
    );
};

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedText = Animated.createAnimatedComponent(Text);


// Componente Principal (Sem alterações na lógica)
export default function Cadastro() {
    const router = useRouter();
    const [mode, setMode] = useState<'selection' | 'login' | 'register'>('selection');
    const [isAnimating, setIsAnimating] = useState(false);

    // --- LÓGICA DE ANIMAÇÃO (SEM ALTERAÇÕES) ---
    const titleOpacity = useRef(new Animated.Value(1)).current;
    const formControlsOpacity = useRef(new Animated.Value(0)).current;
    const formMaxHeight = useRef(new Animated.Value(0)).current;
    const formMarginTop = useRef(new Animated.Value(0)).current; 

    const loginOpacity = useRef(new Animated.Value(1)).current;
    const loginTranslateX = useRef(new Animated.Value(0)).current;
    const registerOpacity = useRef(new Animated.Value(1)).current;
    const registerTranslateX = useRef(new Animated.Value(0)).current;

    const fadeOutDuration = 200; 
    const translateDuration = 350; 
    const translateDistance = width * 0.26; 

    const handleSelectMode = (selectedMode: 'login' | 'register') => {
        if (isAnimating) return; 
        setIsAnimating(true);
        const isLogin = selectedMode === 'login';
        Animated.parallel([
            Animated.timing(titleOpacity, { toValue: 0, duration: fadeOutDuration, useNativeDriver: true }),
            Animated.timing(isLogin ? registerOpacity : loginOpacity, { toValue: 0, duration: fadeOutDuration, useNativeDriver: false })
        ]).start(({ finished }) => {
            if (!finished) { setIsAnimating(false); return; }
            setMode(selectedMode); 
            Animated.parallel([
                Animated.timing(isLogin ? loginTranslateX : registerTranslateX, { toValue: isLogin ? translateDistance : -translateDistance, duration: translateDuration, useNativeDriver: false }),
                Animated.timing(formControlsOpacity, { toValue: 1, duration: translateDuration, useNativeDriver: false }),
                Animated.timing(formMaxHeight, { toValue: 1000, duration: translateDuration, useNativeDriver: false }),
                Animated.timing(formMarginTop, { toValue: 30, duration: translateDuration, useNativeDriver: false })
            ]).start(() => { setIsAnimating(false); });
        });
    };

    const handleBackToSelection = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        Animated.parallel([
            Animated.timing(formControlsOpacity, { toValue: 0, duration: translateDuration, useNativeDriver: false }),
            Animated.timing(formMaxHeight, { toValue: 0, duration: translateDuration, useNativeDriver: false }),
            Animated.timing(formMarginTop, { toValue: 0, duration: translateDuration, useNativeDriver: false }),
            Animated.timing(loginTranslateX, { toValue: 0, duration: translateDuration, useNativeDriver: false }),
            Animated.timing(registerTranslateX, { toValue: 0, duration: translateDuration, useNativeDriver: false }),
        ]).start(({ finished }) => {
            if (!finished) { setIsAnimating(false); return; }
            Animated.parallel([
                Animated.timing(titleOpacity, { toValue: 1, duration: fadeOutDuration, useNativeDriver: true }),
                Animated.timing(loginOpacity, { toValue: 1, duration: fadeOutDuration, useNativeDriver: false }),
                Animated.timing(registerOpacity, { toValue: 1, duration: fadeOutDuration, useNativeDriver: false }),
            ]).start(() => {
                setMode('selection'); 
                setIsAnimating(false); 
            });
        });
    };
    
    const loginColor = loginTranslateX.interpolate({ inputRange: [0, translateDistance], outputRange: ['#44BC7F', '#FF6969'], extrapolate: 'clamp' });
    const registerColor = registerTranslateX.interpolate({ inputRange: [-translateDistance, 0], outputRange: ['#FF6969', '#44BC7F'], extrapolate: 'clamp' });
    // --- FIM DA LÓGICA DE ANIMAÇÃO ---


    // Aplicar os estilos animados independentes
    const loginCardStyle = {
        opacity: loginOpacity,
        transform: [{ translateX: loginTranslateX }],
        backgroundColor: loginColor,
    };
    const registerCardStyle = {
        opacity: registerOpacity,
        transform: [{ translateX: registerTranslateX }],
        backgroundColor: registerColor,
    };
    const titleStyle = { opacity: titleOpacity };
    const backSelectionStyle = { opacity: titleOpacity };
    const backFormStyle = { opacity: formControlsOpacity };
    const formWrapperStyle = {
        opacity: formControlsOpacity,
        maxHeight: formMaxHeight,
        marginTop: formMarginTop, 
    };

    return (
         // --- ESTRUTURA VISUAL (Sem alterações) ---
        <KeyboardAvoidingView style={styles.outerContainer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <ScrollView contentContainerStyle={styles.scrollviewContainer} keyboardShouldPersistTaps="handled">
                {/* Header Falso */}
                <View style={styles.headerBackgroundContainer}>
                    <Image
                        source={require('@/assets/images/fundowc.png')}
                        style={styles.headerBackgroundImage}
                        resizeMode="stretch" 
                    />
                    <View style={styles.headerLogoContainer}>
                        <Image
                            source={require('@/assets/images/nutria.png')}
                            style={styles.logoImage} 
                            resizeMode="contain"
                        />
                         {/* <Text style={styles.slogan}>Seu slogan aqui</Text> */}
                    </View>
                </View>

                 {/* Conteúdo Abaixo do Header */}
                <View style={styles.contentContainer}> 
                    <AnimatedText style={[styles.title, titleStyle]}>
                        O que deseja?
                    </AnimatedText>

                    <View style={styles.mainContent}>
                        {/* Box 1: Login */}
                        <AnimatedTouchableOpacity 
                            style={[ styles.choiceBox, loginCardStyle ]}
                            onPress={() => handleSelectMode('login')}
                            disabled={isAnimating || mode !== 'selection'}
                        >
                            <MaterialCommunityIcons name="flower-tulip-outline" size={width * 0.08} color="#FFFFFF" style={styles.choiceIcon} />
                            <Text style={styles.choiceText}>Entrar em outra conta</Text>
                        </AnimatedTouchableOpacity>

                        {/* Box 2: Register */}
                        <AnimatedTouchableOpacity 
                            style={[ styles.choiceBox, registerCardStyle ]}
                            onPress={() => handleSelectMode('register')}
                            disabled={isAnimating || mode !== 'selection'}
                        >
                            <MaterialCommunityIcons name="seed-outline" size={width * 0.08} color="#FFFFFF" style={styles.choiceIcon} />
                            <Text style={styles.choiceText}>Criar uma conta</Text>
                        </AnimatedTouchableOpacity>
                    </View>

                    <Animated.View style={[styles.formWrapper, formWrapperStyle]}>
                        {mode === 'login' && (
                            <AnimatedFormView>
                                <LoginForm />
                            </AnimatedFormView>
                        )}
                        {mode === 'register' && (
                            <AnimatedFormView>
                                <RegisterForm />
                            </AnimatedFormView>
                        )}
                    </Animated.View>


                    {/* Botões Voltar */}
                    <View style={styles.backButtonContainer}> 
                        <Animated.View 
                            style={[{position: 'absolute'}, backSelectionStyle]}
                            pointerEvents={mode === 'selection' ? 'auto' : 'none'}
                        >
                            <TouchableOpacity 
                                style={styles.backButtonInner} 
                                onPress={() => router.canGoBack() ? router.back() : router.replace('/TelasCadastroLogin/welcome')}
                                disabled={isAnimating}
                            >
                                <Ionicons name="arrow-back" size={20} color="#555" />
                                <Text style={styles.backToWelcomeText}>Voltar para tela inicial</Text>
                            </TouchableOpacity>
                        </Animated.View>
                        
                        <Animated.View 
                            style={[{position: 'absolute'}, backFormStyle]} 
                            pointerEvents={mode !== 'selection' ? 'auto' : 'none'}
                        >
                            <TouchableOpacity 
                                style={styles.backButtonInner} 
                                onPress={handleBackToSelection}
                                disabled={isAnimating}
                            >
                                <Ionicons name="arrow-back" size={20} color="#555" />
                                <Text style={styles.backToWelcomeText}>Voltar para seleção</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </View> 
            </ScrollView>
        </KeyboardAvoidingView>
         // --- FIM DA ESTRUTURA VISUAL ---
    );
}

// Estilos
const styles = StyleSheet.create({
    outerContainer: { // Container externo com fundo padrão
        flex: 1,
        backgroundColor: '#EDEDED',
    },
    scrollviewContainer: {
        flexGrow: 1,
        backgroundColor: 'transparent', // ScrollView transparente
    },
    // --- ESTILOS DO HEADER FALSO ---
    headerBackgroundContainer: {
        height: height * 0.4, // Altura ajustável do header
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
    headerLogoContainer: {
        alignItems: 'center',
        zIndex: 10,
        paddingTop: height * 0.05,
    },
    logoImage:{ // Estilo da logo dentro do header
        width: width * 0.5, // Ajustado para não ficar tão grande
        height: height * 0.07,
        resizeMode: 'contain',
        marginBottom: 10,
    },
    // --- FIM DOS ESTILOS DO HEADER ---

    contentContainer: { // Container para o conteúdo abaixo
        flex: 1,
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: width * 0.05,
        // --- ALTERAÇÃO INÍCIO: Padding inferior reduzido ---
        paddingBottom: 60, // Espaço menor para evitar scroll excessivo
        // --- ALTERAÇÃO FIM ---
        backgroundColor: '#EDEDED', // Fundo cinza para o conteúdo
    },
    title: {
        fontSize: width * 0.06,
        fontFamily: 'Montserrat-SemiBold',
        color: '#333', // Cor escura para fundo claro
        marginBottom: 30,
    },
    mainContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        height: height * 0.18, 
    },
    choiceBox: {
        width: '45%', 
        height: '100%',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.2, 
        shadowRadius: 6,
        elevation: 5, 
    },
    choiceIcon: {
        marginBottom: 10, 
    },
    choiceText: {
        color: '#FFFFFF',
        fontFamily: 'Montserrat-Bold',
        fontSize: width * 0.045,
        textAlign: 'center',
    },
    formWrapper: {
        width: '100%',
        alignItems: 'center',
        overflow: 'hidden',
    },
    input:{ // Input padrão para fundo claro
        width:'100%',
        height: height * 0.06,
        backgroundColor: '#FFFFFF',
        borderRadius:10,
        paddingHorizontal:width*0.04,
        marginVertical:height*0.005,
        color:'#333',
        fontFamily: 'Montserrat-Regular',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        // --- ALTERAÇÃO INÍCIO: Centraliza o texto do input (para o DatePicker) ---
        justifyContent: 'center',
        // --- ALTERAÇÃO FIM ---
    },
    // --- ALTERAÇÃO INÍCIO: Novos estilos para o input de senha ---
    passwordInputWrapper: {
        width: '100%',
        position: 'relative', // Para o posicionamento absoluto do ícone
        marginVertical: height * 0.005, // Aplica a margem que foi removida do input interno
        justifyContent: 'center',
    },
    eyeIcon: {
        position: 'absolute',
        right: width * 0.04, // Alinha com o paddingHorizontal do input
        height: '100%', // Ocupa a altura total do wrapper
        justifyContent: 'center', // Centraliza o ícone verticalmente
        alignItems: 'center',
    },
    // --- ALTERAÇÃO FIM ---
    botao:{ // Botão padrão para fundo claro
        width:'100%',
        paddingVertical: height * 0.018,
        borderRadius:79,
        backgroundColor:'#44BC7F', // Verde padrão
        alignItems:'center',
        marginTop:height*0.02,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    botaoTexto:{
        fontSize: width * 0.04,
        color:'#fff',
        fontFamily: 'Montserrat-Bold',
    },
    linkText:{ // Link padrão para fundo claro
        fontSize: width * 0.035,
        color:'#7DA123', // Cor original do link
        fontFamily: 'Montserrat-Bold',
        textDecorationLine:'underline'
    },
    linkTermos:{ // Link termos padrão para fundo claro
        color:'#7DA123', // Cor original do link
        textDecorationLine:'underline',
        fontWeight: 'normal',
    },
    termosContainer:{
        flexDirection:'row',
        alignItems:'center',
        marginTop:height*0.01,
        paddingHorizontal: width * 0.01,
        width: '100%',
    },
    checkbox:{ // Checkbox padrão para fundo claro
        width: width * 0.05,
        height: width * 0.05,
        borderWidth: 1.5,
        borderColor:'#120D37', // Cor original
        borderRadius: 4,
        alignItems:'center',
        justifyContent:'center',
        marginRight: width * 0.02,
        backgroundColor: 'transparent'
    },
    checkboxMarcado:{backgroundColor:'#44BC7F', borderColor: '#44BC7F'}, // Verde padrão
    checkText:{color:'#fff',fontWeight:'bold'},
    termosTexto:{ // Texto termos padrão para fundo claro
        color:'#333', // Cor escura
        fontSize: width * 0.03,
        flexShrink: 1,
        fontFamily: 'Montserrat-Regular',
        opacity: 1,
    },
    backButtonContainer: { // Botão voltar agora no fluxo, com margem
        // position: 'absolute', // Removido
        // bottom: height * 0.04, // Removido
        marginTop: 'auto', // Empurra para o final do contentContainer, antes do paddingBottom
        marginBottom: 20, // Margem inferior
        height: 40, 
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    backButtonInner: { // Estilo padrão para fundo claro
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'transparent', // Sem fundo extra
        borderRadius: 0,
    },
    backToWelcomeText: { // Estilo padrão para fundo claro
        fontSize: 16,
        color: '#555', // Cor original
        fontFamily: 'Montserrat-SemiBold',
        marginLeft: 8,
    }
});