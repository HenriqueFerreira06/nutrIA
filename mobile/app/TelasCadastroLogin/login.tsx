import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { useAuth } from '@/context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
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
        <View style={styles.container}>
            <Image source={require('@/assets/images/circulo.png')} style={[styles.ellipse,{top:-height*0.2,left:-width*0.25,width:width*1.6,height:width*1.6,opacity:0.9}]}/>
            <Image source={require('@/assets/images/ellipse3.png')} style={[styles.ellipse,{top:height*0.08,left:-width*0.25,width:width*0.8,height:width*0.8,opacity:0.75}]}/>
            <Image source={require('@/assets/images/ellipse3.png')} style={[styles.ellipse,{top:height*0.25,right:-width*0.2,width:width*0.6,height:width*0.6,opacity:0.75}]}/>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.logoetext}>
                    <Image source={require('@/assets/images/nutria.png')} resizeMode="contain" style={styles.logo}/>
                    <Text style={styles.welcomeText}>Que bom que você voltou!</Text>
                </View>
                <View style={styles.contentContainer}>
                    <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#120D37" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
                    <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#120D37" value={password} onChangeText={setPassword} secureTextEntry/>
                    <TouchableOpacity style={styles.forgotPassword} onPress={()=>router.push({ pathname: '/TelasCadastroLogin/esqueciSenha', params: { email: email }})}>
                        <Text style={styles.forgotPasswordText}>Esqueceu a senha? <Text style={styles.link}>Redefina aqui.</Text></Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.loginButtonText}>Entrar</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>router.push('/TelasCadastroLogin/cadastro')}>
                        <Text style={styles.signupText}>Não possui uma conta? <Text style={styles.link}>Cadastre-se.</Text></Text>
                    </TouchableOpacity>
                     <TouchableOpacity onPress={() => router.replace('/TelasCadastroLogin/welcome')} style={{marginTop: 20}}>
                        <Text style={styles.link}>Voltar</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#F5F5F5'},
  ellipse:{position:'absolute',borderRadius:999},
  scrollContainer:{flexGrow:1,justifyContent:'center',paddingHorizontal:width*0.06,paddingTop:height*0.05,paddingBottom:height*0.05},
  logoetext:{alignItems:'center'},
  logo:{width:width*0.55,height:height*0.15,marginTop:height*0.07},
  welcomeText:{fontSize:22,color:'#fff',fontFamily:'Montserrat-Regular',marginBottom:height*0.05,textAlign:'center'},
  contentContainer:{marginTop:height*0.05,alignItems:'center',width:'100%'},
  input:{width:'100%',height:height*0.065,backgroundColor:'#BDBCC5',borderRadius:5,paddingHorizontal:width*0.05,marginBottom:height*0.02,color:'#120D37',fontSize:14,fontFamily:'Montserrat-Regular'},
  forgotPassword:{width:'100%',alignItems:'center',marginBottom:height*0.025},
  forgotPasswordText:{fontSize:12,color:'#120D37',fontFamily:'Montserrat-Regular'},
  link:{color:'#95A720',fontFamily:'Montserrat-Bold'},
  loginButton:{width:'100%',height:height*0.065,backgroundColor:'#120D37',borderRadius:25,justifyContent:'center',alignItems:'center',marginBottom:height*0.03},
  loginButtonText:{fontSize:18,color:'#fff',fontFamily:'Montserrat-Bold'},
  signupText:{fontSize:14,color:'#120D37',fontFamily:'Montserrat-Regular',marginBottom:height*0.015}
});