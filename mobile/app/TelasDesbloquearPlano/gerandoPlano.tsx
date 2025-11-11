import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, SafeAreaView, Dimensions, Alert,Animated, Easing } from 'react-native';
import { Image } from 'expo-image'; 
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useDataStore } from '@/store/data';
import { api } from '@/services/api';
import { auth, db } from '@/app/firebaseConfig';
import type { DataState } from '@/store/data';

const { width } = Dimensions.get('window');
const TOTAL_JOBS = 14; 


function formatKey(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}
const getDayIndex = (dayName: string): number => {
    const lowerDay = dayName.toLowerCase();
    switch (lowerDay) {
        case 'domingo': return 0;
        case 'segunda-feira': return 1;
        case 'terça-feira': return 2;
        case 'quarta-feira': return 3;
        case 'quinta-feira': return 4;
        case 'sexta-feira': return 5;
        case 'sábado': return 6;
        default: return -1;
    }
}
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


const THEME = {
    background: '#e0e1e5', 
    textTitle: '#1E1B3A',     
    textSubtitle: '#6B7280', 
    progressGreen: '#44BC7F', 
    progressBackground: '#E5E7EB', 
};

export default function GerandoPlanoScreen() {
    const userFormData = useDataStore((state: DataState) => state.user);
    const [progress, setProgress] = useState(0); 
    const [statusText, setStatusText] = useState('Por favor, aguarde um momento'); 
    
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const orchestrateGeneration = async () => {
            console.log("--- INICIANDO GERAÇÃO ORQUESTRADA (14 JOBS) ---");
            setStatusText('Iniciando o processo...'); 

            const currentUser = auth.currentUser;
            if (!currentUser) {
                Alert.alert("Erro de autenticação", "Por favor, reinicie o app.");
                router.replace('/');
                return;
            }

            const diasDaSemana = [
                "Segunda-feira", "Terça-feira", "Quarta-feira", 
                "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"
            ];
            const alternativas = [1, 2];
            
            const today = new Date();
            const todayDayIndex = today.getDay();

            try {
                for (const dia of diasDaSemana) {
                    for (const alt of alternativas) {
                        const jobIndex = (diasDaSemana.indexOf(dia) * 2) + alt;
                        setStatusText(`Gerando ${dia} (Opção ${alt})...`);

                      

                        const response = await api.post('/gerar-plano-dia', {
                            ...userFormData,
                            diaDaSemana: dia,
                            indiceAlternativa: alt
                        });

                        const planoCompleto = response.data.data;
                        if (!planoCompleto || !planoCompleto.resumo) {
                            throw new Error(`API retornou dados inválidos para ${dia} (Opção ${alt})`);
                        }

                        const targetDayIndex = getDayIndex(dia);
                        const dateDiff = targetDayIndex - todayDayIndex;
                        const targetDate = new Date(today);
                        targetDate.setDate(today.getDate() + dateDiff);
                        const dateKey = formatKey(targetDate);

                        const dailyDocRef = db.collection('users').doc(currentUser.uid).collection('dailyData').doc(dateKey);
                        
                        const dataToSave = {
                            [`planos.${alt}`]: planoCompleto,
                            aguaConsumida: 0 
                        };

                        await dailyDocRef.set(dataToSave, { merge: true });
                        setProgress(jobIndex);
                        await delay(3000); 
                    }
                }

                console.log("--- GERAÇÃO ORQUESTRADA CONCLUÍDA ---");
                setStatusText('Plano concluído!');
                router.replace('/TelasDesbloquearPlano/plano');

            } catch (error) {
                console.error("--- ERRO NA GERAÇÃO ORQUESTRADA ---", error);
              
                Alert.alert("Ops!", "Tivemos um probleminha na geração. Tente novamente.");
                router.back();
            }
        };

        orchestrateGeneration();
    }, [userFormData]);

    const progressPercent = (progress / TOTAL_JOBS) * 100;

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: progressPercent,
            duration: 400,
            useNativeDriver: false,
            easing: Easing.out(Easing.ease),
        }).start();
    }, [progressPercent]);

    const animatedWidth = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style="dark" />
            
            <View style={styles.container}>
                <Text style={styles.title}>
                    Gerando seu {'\n'}
                    plano alimentar...
                </Text>

                <Text style={styles.subtitle}>
                    {statusText}
                </Text>
                
                <View style={styles.progressContainer}>
                    <Animated.View style={[styles.progressBar, { width: animatedWidth }]} />
                </View>

                <View style={styles.progressTextContainer}>
                    <Text style={styles.progressText}>
                        {Math.round(progressPercent)}% concluído
                    </Text>
                </View>

                
                <Image 
                    source={require('@/assets/images/karu_andando.gif')} 
                    style={styles.mascot}
                    contentFit="contain" 
                />
                

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: THEME.background,
    },
    container: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingHorizontal: 32, 
    },
    title: { 
        fontSize: width * 0.09, 
        fontFamily: 'Montserrat-Bold', 
        color: THEME.textTitle, 
        textAlign: 'center', 
        lineHeight: width * 0.1,
        marginBottom: 16, 
    },
    subtitle: { 
        fontSize: width * 0.04, 
        fontFamily: 'Montserrat-Regular', 
        color: THEME.textSubtitle, 
        textAlign: 'center',
        marginBottom: 40,
        height: 50, 
        textAlignVertical: 'center', 
    },
    progressContainer: {
        width: '100%', 
        height: 10,
        backgroundColor: THEME.progressBackground,
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: THEME.progressGreen,
        borderRadius: 5,
    },
    progressTextContainer: {
        width: '100%', 
        alignItems: 'flex-end', 
        marginTop: 8, 
    },
    progressText: {
        fontSize: width * 0.035,
        fontFamily: 'Montserrat-Medium', 
        color: THEME.textSubtitle,
    },
    mascot: {
        width: width * 0.6, 
        height: width * 0.6, 
        marginTop: 60, 
    }
});