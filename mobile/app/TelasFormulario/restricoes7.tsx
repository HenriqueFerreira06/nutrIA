import React from 'react';
import { StyleSheet, Text, View, Pressable, SafeAreaView, ScrollView, TextInput, KeyboardAvoidingView, Platform, Dimensions, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useDataStore } from '../../store/data';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { auth, db } from '../firebaseConfig';

const { width } = Dimensions.get('window');

const schema = z.object({
    temRestricoes: z.enum(['Sim', 'Não']),
    restricoes: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.temRestricoes === 'Sim' && (!data.restricoes || data.restricoes.trim().length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['restricoes'],
            message: 'Por favor, descreva suas restrições.',
        });
    }
});

type FormData = z.infer<typeof schema>;

export default function RestricoesScreen() {
    const { user, updateUser } = useDataStore();

    const { control, handleSubmit, watch, formState: { errors, isValid } } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        defaultValues: {
            temRestricoes: user.restricoes && user.restricoes !== 'Não informado' ? 'Sim' : 'Não',
            restricoes: user.restricoes !== 'Não informado' ? user.restricoes : '',
        }
    });

    const watchTemRestricoes = watch('temRestricoes');

    const handleFinalize = async (data: FormData) => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            Alert.alert("Erro", "Você não está autenticado. Por favor, reinicie o aplicativo.");
            router.replace('/TelasCadastroLogin/welcome');
            return;
        }

        const finalRestricoes = data.temRestricoes === 'Sim' ? data.restricoes : 'Não informado';
        updateUser({ restricoes: finalRestricoes });
        
        try {
            const userDocRef = db.collection("users").doc(currentUser.uid);
            await userDocRef.set({ 
                onboardingComplete: true 
            }, { merge: true }); 

            console.log("Onboarding finalizado para o usuário:", currentUser.uid);
            router.push('/TelasDesbloquearPlano/gerandoPlano');
        } catch (error) {
            console.error("Erro ao finalizar o onboarding:", error);
            Alert.alert("Erro", "Não foi possível salvar seu progresso. Tente novamente.");
        }
    };

    const handleGoBack = () => router.back();

    const colors = {
        background: '#F8F9FA',
        primaryText: '#1E1B3A',
        unselectedOptionBg: '#FFFFFF',
        unselectedOptionBorder: '#E5E7EB',
        selectedOptionBg: '#44BC7F',
        buttonEnabledBg: '#1B0C45',
        buttonDisabledBg: 'rgba(27, 12, 69, 0.5)',
        buttonText: '#FFFFFF',
        inputPlaceholder: '#9CA3AF',
        error: '#EF4444',
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <View style={styles.container}>
                    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                        <Pressable onPress={handleGoBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={28} color={colors.primaryText} />
                        </Pressable>

                        <Text style={[styles.title, { color: colors.primaryText }]}>
                            Você possui alergia/{'\n'}seletividade/não gosta{'\n'}de algo?
                        </Text>
                        
                        <Controller
                            control={control}
                            name="temRestricoes"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.choiceContainer}>
                                    <Pressable style={[styles.choiceButton, value === 'Não' ? styles.choiceSelected : styles.choiceUnselected]} onPress={() => onChange('Não')}>
                                        <Text style={[styles.choiceText, {color: colors.primaryText}]}>Não</Text>
                                    </Pressable>
                                    <Pressable style={[styles.choiceButton, value === 'Sim' ? styles.choiceSelected : styles.choiceUnselected]} onPress={() => onChange('Sim')}>
                                        <Text style={[styles.choiceText, {color: colors.primaryText}]}>Sim</Text>
                                    </Pressable>
                                </View>
                            )}
                        />

                        {watchTemRestricoes === 'Sim' && (
                            <Controller
                                control={control}
                                name="restricoes"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput 
                                        style={[styles.textInput, errors.restricoes && styles.inputError]} 
                                        placeholder="Ex: Cebola, camarão, couve-flor, não gosto do cheiro de alho, não gosto de textura gelatinosa, etc." 
                                        placeholderTextColor={colors.inputPlaceholder} 
                                        onBlur={onBlur} 
                                        onChangeText={onChange} 
                                        value={value || ''} 
                                        multiline 
                                    />
                                )}
                            />
                        )}
                        {errors.restricoes && <Text style={styles.errorText}>{errors.restricoes.message}</Text>}
                    </ScrollView>

                    <Pressable
                        onPress={handleSubmit(handleFinalize)}
                        disabled={!isValid}
                        style={[styles.nextButton, { backgroundColor: isValid ? colors.buttonEnabledBg : colors.buttonDisabledBg }]}
                    >
                        <Text style={styles.nextButtonText}>Finalizar</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, },
    container: { flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, justifyContent: 'space-between', },
    scrollContainer: { paddingBottom: 20, },
    backButton: { alignSelf: 'flex-start', marginBottom: 24, },
    title: { fontSize: width * 0.075, fontFamily: 'Montserrat-Bold', lineHeight: width * 0.1, marginBottom: 24, },
    choiceContainer: { flexDirection: 'row', gap: 16, },
    choiceButton: { flex: 1, paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, },
    choiceSelected: { backgroundColor: '#44BC7F', borderColor: 'transparent', },
    choiceUnselected: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', },
    choiceText: { fontSize: width * 0.04, fontFamily: 'Montserrat-SemiBold', },
    textInput: { width: '100%', minHeight: 140, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E7EB', marginTop: 16, paddingHorizontal: 20, paddingTop: 20, textAlignVertical: 'top', fontSize: width * 0.04, fontFamily: 'Montserrat-Regular', color: '#1E1B3A', lineHeight: 24, },
    inputError: { borderColor: '#EF4444', },
    nextButton: { width: '100%', paddingVertical: 18, borderRadius: 100, alignItems: 'center', justifyContent: 'center', },
    nextButtonText: { fontSize: width * 0.045, fontFamily: 'Montserrat-Bold', color: '#FFFFFF' },
    errorText: { color: '#EF4444', fontFamily: 'Montserrat-Regular', marginTop: 8, marginLeft: 4, fontSize: width * 0.035, }
});