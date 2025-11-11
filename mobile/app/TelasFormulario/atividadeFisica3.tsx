import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    Pressable,
    SafeAreaView,
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
    level: z.string().min(1, "Por favor, selecione uma frequência."),
});

type FormData = z.infer<typeof schema>;

export default function AtividadeFisicaScreen() {
    const updateUser = useDataStore(state => state.updateUser);

    const { control, handleSubmit, watch, formState: { isValid } } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: 'onChange'
    });
    
    const selectedLevel = watch('level');

    const activityLevels = [
        "Nunca",
        "Poucas vezes na semana (1-2 dias)",
        "Regularmente (3-4 dias)",
        "Sempre (5-7 dias)",
    ];

    const handleNext = (data: FormData) => {
        updateUser({ level: data.level });
        console.log("Nível de atividade salvo:", data.level);
        router.push('/TelasFormulario/modeloDieta4');
    };

    const handleGoBack = () => {
        router.back();
    };

    // Paleta de cores baseada na referência
    const colors = {
        background: '#F8F9FA',
        primaryText: '#1E1B3A',
        unselectedOptionBg: '#FFFFFF',
        unselectedOptionBorder: '#E5E7EB',
        selectedOptionBg: '#44BC7F', // Tom de verde claro da referência
        selectedOptionText: '#FFFFFF',
        buttonEnabledBg: '#1B0C45',
        buttonDisabledBg: 'rgba(27, 12, 69, 0.5)',
        buttonText: '#FFFFFF',
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <StatusBar style="dark" />
            <View style={styles.container}>
                <View>
                    <Pressable onPress={handleGoBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color={colors.primaryText} />
                    </Pressable>

                    <Text style={[styles.title, { color: colors.primaryText }]}>
                        Com qual frequência{'\n'}você costuma praticar{'\n'}atividade física?
                    </Text>

                    <Controller
                        control={control}
                        name="level"
                        render={({ field: { onChange } }) => (
                            <View style={styles.optionsContainer}>
                                {activityLevels.map((level) => {
                                    const isSelected = selectedLevel === level;
                                    return (
                                        <Pressable
                                            key={level}
                                            style={[
                                                styles.optionButton,
                                                { 
                                                    backgroundColor: isSelected ? colors.selectedOptionBg : colors.unselectedOptionBg,
                                                    borderColor: isSelected ? 'transparent' : colors.unselectedOptionBorder,
                                                },
                                            ]}
                                            onPress={() => onChange(level)}
                                        >
                                            <Text style={[styles.optionText, { color: colors.primaryText }]}>{level}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        )}
                    />
                </View>
                
                <Pressable
                    onPress={handleSubmit(handleNext)}
                    disabled={!isValid}
                    style={[
                        styles.nextButton,
                        { backgroundColor: isValid ? colors.buttonEnabledBg : colors.buttonDisabledBg },
                    ]}
                >
                    <Text style={[styles.nextButtonText, { color: colors.buttonText }]}>Próximo</Text>
                </Pressable>
            </View>
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
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 24,
    },
    title: {
        fontSize: width * 0.08,
        fontFamily: 'Montserrat-Bold',
        lineHeight: width * 0.1,
        marginBottom: 40,
    },
    optionsContainer: {
        width: '100%',
        gap: 16,
    },
    optionButton: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    optionText: {
        fontSize: width * 0.04,
        fontFamily: 'Montserrat-SemiBold',
    },
    nextButton: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextButtonText: {
        fontSize: width * 0.045,
        fontFamily: 'Montserrat-Bold',
    },
});