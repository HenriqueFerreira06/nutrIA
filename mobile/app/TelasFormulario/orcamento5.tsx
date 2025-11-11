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

const schema = z.object({
    orcamento: z.string().min(1, "Por favor, selecione uma faixa de orçamento."),
});

type FormData = z.infer<typeof schema>;

export default function OrcamentoScreen() {
    const updateUser = useDataStore(state => state.updateUser);

    const { control, handleSubmit, watch, formState: { isValid } } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: 'onChange'
    });

    const selectedBudget = watch('orcamento');

    const budgetOptions = [
        "Até R$ 500",
        "De R$ 500 a R$ 700",
        "De R$ 700 a R$ 1000",
        "De R$ 1000 a R$ 1500",
        "Mais de R$ 1500",
        "Não tenho um valor fixo",
    ];

    const handleNext = (data: FormData) => {
        updateUser({ orcamento: data.orcamento });
        router.push('/TelasFormulario/saude6');
    };

    const handleGoBack = () => {
        router.back();
    };

    const colors = {
        background: '#F8F9FA',
        primaryText: '#1E1B3A',
        highlightText: '#44BC7F',
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
            
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                <View style={styles.header}>
                    <Pressable onPress={handleGoBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color={colors.primaryText} />
                    </Pressable>

                    <Text style={[styles.title, { color: colors.primaryText }]}>
                        Quanto você estaria {'\n'}disposto a gastar em {'\n'}alimentação 
                        <Text style={{ color: colors.highlightText }}> mensalmente?</Text>
                    </Text>
                </View>

                <Controller
                    control={control}
                    name="orcamento"
                    render={({ field: { onChange } }) => (
                        <View style={styles.optionsContainer}>
                            {budgetOptions.map((option) => {
                                const isSelected = selectedBudget === option;
                                return (
                                    <Pressable
                                        key={option}
                                        style={[
                                            styles.optionButton,
                                            { 
                                                backgroundColor: isSelected ? colors.selectedOptionBg : colors.unselectedOptionBg,
                                                borderColor: isSelected ? 'transparent' : colors.unselectedOptionBorder,
                                            },
                                        ]}
                                        onPress={() => onChange(option)}
                                    >
                                        <Text style={[styles.optionText, { color: colors.primaryText }]}>{option}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    )}
                />
            </ScrollView>

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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    scrollContainer: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 80,
    },
    header: {
        marginBottom: 40,
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 24,
    },
    title: {
        fontSize: width * 0.08,
        fontFamily: 'Montserrat-Bold',
        lineHeight: width * 0.1,
    },
    optionsContainer: {
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
        width: '90%',
        alignSelf: 'center',
        marginBottom: 20,
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
