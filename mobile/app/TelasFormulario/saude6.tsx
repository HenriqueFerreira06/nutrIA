import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    Pressable,
    SafeAreaView,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useDataStore } from '../../store/data';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const { width } = Dimensions.get('window');

const schema = z.object({
    tomaMedicamento: z.enum(['Sim', 'Não']),
    medicamentos: z.string().optional(),
    temCondicaoMedica: z.enum(['Sim', 'Não']),
    condicaoMedica: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.tomaMedicamento === 'Sim' && (!data.medicamentos || data.medicamentos.trim().length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['medicamentos'],
            message: 'Por favor, informe o(s) nome(s) do(s) medicamento(s).',
        });
    }
    if (data.temCondicaoMedica === 'Sim' && (!data.condicaoMedica || data.condicaoMedica.trim().length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['condicaoMedica'],
            message: 'Por favor, informe a condição médica.',
        });
    }
});

type FormData = z.infer<typeof schema>;

export default function SaudeScreen() {
    const updateUser = useDataStore(state => state.updateUser);

    const { control, handleSubmit, watch, formState: { errors, isValid } } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        defaultValues: {
            tomaMedicamento: 'Não',
            temCondicaoMedica: 'Não',
        }
    });

    const watchTomaMedicamento = watch('tomaMedicamento');
    const watchTemCondicaoMedica = watch('temCondicaoMedica');

    const handleNext = (data: FormData) => {
        const finalData = {
            medicamentos: data.tomaMedicamento === 'Sim' ? data.medicamentos : 'Não informado',
            condicaoMedica: data.temCondicaoMedica === 'Sim' ? data.condicaoMedica : 'Não informado',
        };
        updateUser(finalData);
        console.log("Dados de saúde salvos:", finalData);
        router.push('/TelasFormulario/restricoes7');
    };

    const handleGoBack = () => {
        router.back();
    };

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
                            Você toma algum {'\n'}medicamento que afeta {'\n'}sua saúde ou corpo?
                        </Text>
                        <Controller
                            control={control}
                            name="tomaMedicamento"
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
                        {watchTomaMedicamento === 'Sim' && (
                            <Controller
                                control={control}
                                name="medicamentos"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput style={[styles.textInput, errors.medicamentos && styles.inputError]} placeholder="Escreva o(s) nome(s) aqui" placeholderTextColor={colors.inputPlaceholder} onBlur={onBlur} onChangeText={onChange} value={value || ''} multiline />
                                )}
                            />
                        )}
                        {errors.medicamentos && <Text style={styles.errorText}>{errors.medicamentos.message}</Text>}

                        <Text style={[styles.title, styles.secondTitle, { color: colors.primaryText }]}>
                            Possui condição médica?
                        </Text>
                        <Controller
                            control={control}
                            name="temCondicaoMedica"
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
                        {watchTemCondicaoMedica === 'Sim' && (
                            <Controller
                                control={control}
                                name="condicaoMedica"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput style={[styles.textInput, errors.condicaoMedica && styles.inputError]} placeholder="Indique a condição aqui (ex: diabetes tipo 2...)" placeholderTextColor={colors.inputPlaceholder} onBlur={onBlur} onChangeText={onChange} value={value || ''} multiline />
                                )}
                            />
                        )}
                         {errors.condicaoMedica && <Text style={styles.errorText}>{errors.condicaoMedica.message}</Text>}
                    </ScrollView>

                    <Pressable
                        onPress={handleSubmit(handleNext)}
                        disabled={!isValid}
                        style={[
                            styles.nextButton, 
                            { backgroundColor: isValid ? colors.buttonEnabledBg : colors.buttonDisabledBg }
                        ]}
                    >
                        <Text style={styles.nextButtonText}>Próximo</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 40,
        justifyContent: 'space-between',
    },
    scrollContainer: {
        paddingBottom: 20,
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 24,
    },
    title: {
        fontSize: width * 0.075,
        fontFamily: 'Montserrat-Bold',
        lineHeight: width * 0.1,
        marginBottom: 24,
    },
    secondTitle: {
        marginTop: 40,
    },
    choiceContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    choiceButton: {
        flex: 1,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
    },
    choiceSelected: {
        backgroundColor: '#44BC7F',
        borderColor: 'transparent',
    },
    // Estilo para o botão não selecionado
    choiceUnselected: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E5E7EB',
    },
    choiceText: {
        fontSize: width * 0.04,
        fontFamily: 'Montserrat-SemiBold',
    },
    textInput: {
        width: '100%',
        minHeight: 120,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        marginTop: 16,
        paddingHorizontal: 20,
        paddingTop: 20,
        textAlignVertical: 'top',
        fontSize: width * 0.04,
        fontFamily: 'Montserrat-Regular',
        color: '#1E1B3A',
        lineHeight: 24,
    },
    inputError: {
        borderColor: '#EF4444',
    },
    nextButton: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // O estilo 'buttonDisabled' não é mais necessário aqui, pois a cor é controlada em linha
    nextButtonText: {
        fontSize: width * 0.045,
        fontFamily: 'Montserrat-Bold',
        color: '#FFFFFF'
    },
    errorText: {
        color: '#EF4444',
        fontFamily: 'Montserrat-Regular',
        marginTop: 8,
        marginLeft: 4,
        fontSize: width * 0.035,
    }
});