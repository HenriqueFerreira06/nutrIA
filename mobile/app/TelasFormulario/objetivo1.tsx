import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, SafeAreaView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDataStore } from '../../store/data';

const { width } = Dimensions.get('window');

export default function ObjetivoScreen() {
    const [selectedObjective, setSelectedObjective] = useState<string | null>(null);

    const updateUser = useDataStore(state => state.updateUser);

    const objectives = [
        "Emagrecer",
        "Ganhar massa muscular",
        "Saúde",
        "Reeducação alimentar",
        "Manutenção do peso",
    ];

    const handleNext = () => {
        if (!selectedObjective) return;
        updateUser({ objective: selectedObjective });
        router.push('/TelasFormulario/biometria2');
    };

    const handleGoBack = () => {
        router.back();
    };
    
    const colors = {
        primary: '#1E1B3A',
        buttonBackground: '#1B0C45',
        buttonText: '#FFFFFF',
        selectedOptionBackground: '#44BC7F',
        selectedOptionText: '#FFFFFF',
        unselectedOptionBackground: '#FFFFFF',
        unselectedOptionBorder: '#E5E7EB',
        disabledButton: 'rgba(27, 12, 69, 0.5)',
        background: '#F8F9FA',
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={styles.container}>
                <View>
                    

                    <Text style={[styles.title, { color: colors.primary }]}>
                        Qual o seu objetivo ao {'\n'}criar um plano {'\n'}alimentar?
                    </Text>

                    <View style={styles.optionsContainer}>
                        {objectives.map((objective) => {
                            const isSelected = selectedObjective === objective;
                            return (
                                <Pressable
                                    key={objective}
                                    style={[
                                        styles.optionButton,
                                        { 
                                            backgroundColor: isSelected ? colors.selectedOptionBackground : colors.unselectedOptionBackground,
                                            borderColor: isSelected ? colors.selectedOptionBackground : colors.unselectedOptionBorder,
                                        },
                                    ]}
                                    onPress={() => setSelectedObjective(objective)}
                                >
                                    <Text style={[
                                        styles.optionText, 
                                        { color: isSelected ? colors.selectedOptionText : colors.primary }
                                    ]}>
                                        {objective}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
                
                <Pressable
                    onPress={handleNext}
                    disabled={!selectedObjective}
                    style={[
                        styles.nextButton,
                        { backgroundColor: selectedObjective ? colors.buttonBackground : colors.disabledButton },
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
        paddingTop: 64,
        paddingBottom: 40,
        justifyContent: 'space-between',
    },
    
    title: {
        fontSize: width * 0.08, 
        fontFamily: 'Montserrat-Bold',
        lineHeight: width * 0.1,
        marginBottom: 32,
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