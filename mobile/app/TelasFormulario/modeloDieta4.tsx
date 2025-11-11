import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    Pressable,
    SafeAreaView,
    ScrollView,
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

// Esquema de validação para esta tela
const schema = z.object({
    modeloDieta: z.string().min(1, "Por favor, selecione um modelo."),
});

type FormData = z.infer<typeof schema>;

export default function ModeloDietaScreen() {
    const updateUser = useDataStore(state => state.updateUser);

    const { control, handleSubmit, watch, formState: { isValid } } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: 'onChange'
    });
    
    const selectedModel = watch('modeloDieta');

    const dietModels = [
        "Jejum intermitente",
        "Déficit calórico",
        "Superávit calórico",
        "Low Carb",
        "Cetogênica",
        "Não sigo dietas, como livremente",
    ];

    const handleNext = (data: FormData) => {
        updateUser({ modeloDieta: data.modeloDieta });
        console.log("Modelo de dieta salvo:", data.modeloDieta);
        router.push('/TelasFormulario/orcamento5');
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
        selectedOptionBg: '#44BC7F',
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
                        Você segue algum {'\n'}modelo de dieta?
                    </Text>

                    <Controller
                        control={control}
                        name="modeloDieta"
                        render={({ field: { onChange } }) => (
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
                                <View style={styles.optionsContainer}>
                                    {dietModels.map((model) => {
                                        const isSelected = selectedModel === model;
                                        return (
                                            <Pressable
                                                key={model}
                                                style={[
                                                    styles.optionButton,
                                                    { 
                                                        backgroundColor: isSelected ? colors.selectedOptionBg : colors.unselectedOptionBg,
                                                        borderColor: isSelected ? 'transparent' : colors.unselectedOptionBorder,
                                                    },
                                                ]}
                                                onPress={() => onChange(model)}
                                            >
                                                <Text style={[styles.optionText, { color: colors.primaryText }]}>{model}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </ScrollView>
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
    scrollContainer: {
        paddingBottom: 20, // Espaço extra no final da rolagem
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