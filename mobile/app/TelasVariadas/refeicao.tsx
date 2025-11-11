// app/TelasVariadas/refeicao.tsx

import React, { useState, useMemo } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';
import { Meal } from '@/store/data'; // Mantenha sua importação de Meal
import { auth, db } from '@/app/firebaseConfig';

const { width, height } = Dimensions.get('window');

const THEME = {
    background: '#EDEDED',
    headerBackground: '#44BC7F',
    textPrimary: '#1E1B3A',
    textSecondary: '#6B7280',
    green: '#44BC7F',
    darkBlue: '#1B0C45',
    grayLight: '#F3F4F6',
    white: '#FFFFFF',
    gray: '#E5E7EB',
    greenLight: 'rgba(68, 188, 127, 0.15)',
};

// Interface para os dados do plano (Resumo + Refeições)
interface PlanoCompleto {
    resumo: any;
    refeicoes: Meal[];
}

const MacroCard = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.macroCard}>
        <Text style={styles.macroValue}>{value}</Text>
        <Text style={styles.macroLabel}>{label}</Text>
    </View>
);

export default function RefeicaoScreen() {
    const router = useRouter();
    
    // O 'activePlanKey' da home.tsx nos ajuda a saber qual 'selectedAlternativa' é o padrão
    const params = useLocalSearchParams<{ 
        mealNome?: string;
        plan1Data?: string;
        plan2Data?: string;
        dateKey?: string;
        activePlanKey?: '1' | '2'; // Recebe o 'activePlanKey' da home
    }>();

    // Define a alternativa padrão com base no que estava ativo na home
    const defaultAlternativa = (params.activePlanKey === '2' ? '2' : '1');
    const [selectedAlternativa, setSelectedAlternativa] = useState<'1' | '2'>(defaultAlternativa);
    const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);

    // Parseia os planos recebidos (sem alterações)
    const plan1: PlanoCompleto | null = useMemo(() => {
        return params.plan1Data ? JSON.parse(params.plan1Data) : null;
    }, [params.plan1Data]);

    const plan2: PlanoCompleto | null = useMemo(() => {
        return params.plan2Data ? JSON.parse(params.plan2Data) : null;
    }, [params.plan2Data]);

    // Encontra a refeição correspondente em cada plano (sem alterações)
    const baseMeal: Meal | undefined = useMemo(() => {
        return plan1?.refeicoes?.find(m => m.nome === params.mealNome);
    }, [plan1, params.mealNome]);

    const altMeal: Meal | undefined = useMemo(() => {
        return plan2?.refeicoes?.find(m => m.nome === params.mealNome);
    }, [plan2, params.mealNome]);

    const meal: Meal | null = useMemo(() => {
        if (selectedAlternativa === '1') {
            return baseMeal || null;
        } else {
            // Se a Opção 2 for selecionada, ela tem prioridade.
            // Se a Opção 2 não existir (mas o botão foi clicado), usa a 1 como fallback.
            return altMeal || baseMeal || null; 
        }
    }, [selectedAlternativa, baseMeal, altMeal]);


    // =======================================================
    // --- INÍCIO DA CORREÇÃO (MODO CUMULATIVO) ---
    // =======================================================
    const handleMarkAsCompleted = async () => {
        if (!meal || !params.dateKey) {
             Alert.alert("Erro", "Dados da refeição incompletos.");
            return;
        }
        
        const currentUser = auth.currentUser;
        if (!currentUser) {
            Alert.alert("Erro", "Você precisa estar logado.");
            return;
        }

        try {
            const dateKey = params.dateKey;
            const altKey = selectedAlternativa; // '1' ou '2'
            const otherAltKey = altKey === '1' ? '2' : '1';
            
            const dailyDocRef = db.collection('users').doc(currentUser.uid).collection('dailyData').doc(dateKey);
            
            // 1. Busca os dados atuais do Firestore (ou usa um objeto vazio)
            const docSnap = await dailyDocRef.get();
            const dailyData = docSnap.data() || {};

            // 2. Define os caminhos corretos usando a notação de ponto
            const savePathKey = `planos.${altKey}`; // ex: "planos.1"
            const otherSavePathKey = `planos.${otherAltKey}`; // ex: "planos.2"

            // 3. Pega os dados atuais do plano que vamos ATUALIZAR
            const planoAtualCompleto: PlanoCompleto | null = 
                dailyData?.[savePathKey] || 
                (altKey === '1' ? plan1 : plan2);
            
            if (!planoAtualCompleto || !Array.isArray(planoAtualCompleto.refeicoes)) {
                Alert.alert("Erro", `Plano ${altKey} não encontrado para atualizar.`);
                return;
            }

            // 4. Pega os dados atuais do plano que vamos RESETAR
            const outroPlanoCompleto: PlanoCompleto | null = 
                dailyData?.[otherSavePathKey] || 
                (otherAltKey === '1' ? plan1 : plan2);

            // 5. Cria a nova lista de refeições para o plano ATIVO (completed: true)
            const updatedMeals = planoAtualCompleto.refeicoes.map((r: Meal) => 
                (r.id === meal.id || r.nome === meal.nome) 
                    ? { ...r, completed: true } 
                    : r
            );

            // 6. Prepara o objeto de atualização para o Firebase
            const updates: { [key: string]: any } = {};
            
            // Atualiza o plano ATIVO (preserva o resumo, atualiza refeicoes)
            updates[savePathKey] = {
                ...planoAtualCompleto, // Mantém o resumo e outros dados
                refeicoes: updatedMeals
            };

            // 7. Reseta a REFEIÇÃO CORRESPONDENTE no OUTRO plano (se existir)
            if (outroPlanoCompleto && Array.isArray(outroPlanoCompleto.refeicoes)) {
                
                // *** MUDANÇA AQUI ***
                // Reseta APENAS a refeição correspondente (pelo nome ou id)
                // em vez de resetar todas as refeições completas.
                const otherMealsResetados = outroPlanoCompleto.refeicoes.map((r: Meal) => 
                    (r.id === meal.id || r.nome === meal.nome) 
                        ? { ...r, completed: false } // Desmarca a correspondente
                        : r // Mantém as outras como estão
                );
                // *** FIM DA MUDANÇA ***
                
                // Atualiza o OUTRO plano (preserva o resumo, atualiza refeicoes)
                updates[otherSavePathKey] = {
                    ...outroPlanoCompleto,
                    refeicoes: otherMealsResetados
                };
            }
            
            // 8. Executa a atualização no Firebase
            // Usamos .set com { merge: true } para garantir que
            // `planos.1` e `planos.2` sejam atualizados corretamente,
            // sem apagar `aguaConsumida` ou outros campos.
            await dailyDocRef.set(updates, { merge: true });

            // Volta para Home (o listener do Home irá pegar a mudança)
            router.back();

        } catch (error) {
            console.error("Erro ao marcar refeição como concluída:", error);
            Alert.alert("Erro", "Não foi possível atualizar a refeição.");
        }
    };
    // =======================================================
    // --- FIM DA CORREÇÃO ---
    // =======================================================

    const handleSelectAlternativa = (alt: '1' | '2') => {
        setCheckedIngredients([]); // Limpa os checkboxes
        setSelectedAlternativa(alt);
    };

    const toggleIngredient = (ingredient: string) => {
        setCheckedIngredients(prev => 
            prev.includes(ingredient)
                ? prev.filter(item => item !== ingredient)
                : [...prev, ingredient]
        );
    };

    if (!meal) {
        // (Sem alterações)
        return (
            <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center'}]}>
                <Text>Refeição não encontrada.</Text>
                <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
                    <Text>Voltar</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.pageContainer}>
            <Image
                source={require('@/assets/images/ellipse3.png')}
                style={styles.backgroundImage}
            />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ChevronLeft size={32} color={THEME.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Refeição</Text>
                </View>

                {/* Mostra o switcher APENAS se o 'altMeal' (Opção 2) existir */}
                {altMeal && (
                    <View style={styles.switcherContainer}>
                        <TouchableOpacity
                            style={[styles.switcherButton, selectedAlternativa === '1' && styles.switcherButtonActive]}
                            onPress={() => handleSelectAlternativa('1')}
                        >
                            <Text style={[styles.switcherText, selectedAlternativa === '1' && styles.switcherTextActive]}>Opção 1</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.switcherButton, selectedAlternativa === '2' && styles.switcherButtonActive]}
                            onPress={() => handleSelectAlternativa('2')}
                        >
                            <Text style={[styles.switcherText, selectedAlternativa === '2' && styles.switcherTextActive]}>Opção 2</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* O restante do seu JSX (ScrollView, MacroCard, etc.) não precisa de alterações */}
                <ScrollView
                    style={styles.scrollWrapper}
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.mealTitle}>{meal.nome}</Text> 
                    <View style={styles.categoryTag}>
                        <Text style={styles.categoryText}>{meal.categoria}</Text>
                    </View>

                    <View style={styles.macrosContainer}>
                        <MacroCard label="Kcal" value={(meal.calorias || 0).toFixed(0)} /> 
                        <MacroCard label="Proteínas" value={(meal.proteinas || 0).toFixed(1)} />
                        <MacroCard label="Carbs" value={(meal.carboidratos || 0).toFixed(1)} />
                        <MacroCard label="Gorduras" value={(meal.lipidios || 0).toFixed(1)} />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Ingredientes</Text>
                        {meal.ingredientes.map((ing, index) => (
                            <TouchableOpacity key={index} style={styles.ingredientItem} onPress={() => toggleIngredient(ing.texto)}>
                                <View style={[styles.checkbox, checkedIngredients.includes(ing.texto) && styles.checkboxChecked]}>
                                    {checkedIngredients.includes(ing.texto) && <Check size={16} color={THEME.white} />}
                                </View>
                                <Text style={styles.ingredientText}>{ing.texto}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.prepTimeCard}>
                        <Text style={styles.prepTimeLabel}>Tempo de preparo</Text>
                        <Text style={styles.prepTimeValue}>{meal.tempoPreparo}</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Modo de preparo</Text>
                        {meal.modoPreparo.map((step, index) => (
                            <View key={index} style={styles.stepItem}>
                                <Text style={styles.stepNumber}>{index + 1}.</Text>
                                <Text style={styles.stepText}>{step}</Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[styles.completeButton, meal.completed && { backgroundColor: THEME.green }]} // Feedback visual
                        onPress={handleMarkAsCompleted}
                        disabled={meal.completed} // Desativa se já estiver completa
                    >
                        <Text style={styles.completeButtonText}>
                            {meal.completed ? "Concluído" : "Marcar como concluído"}
                        </Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}

// ESTILOS (Mantenha todos os seus estilos originais)
const styles = StyleSheet.create({
    pageContainer: {
        flex: 1,
        backgroundColor: '#44BC7F',
    },
    backgroundImage: {
        position: 'absolute',
        width: width * 1.5,
        height: height * 0.7,
        top: height * -0.15,
        left: width * -0.5,
        opacity: 0.1,
        resizeMode: 'contain',
    },
    safeArea: {
        flex: 1,
        marginTop: 40, 
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
    },
    backButton: {
        position: 'absolute',
        left: 15,
        top: 10,
        padding: 8,
    },
    headerTitle: {
        fontSize: width * 0.05,
        fontFamily: 'Montserrat-Bold',
        color: THEME.textPrimary,
    },
    switcherContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: THEME.gray,
        marginHorizontal: 24,
        borderRadius: 100,
        padding: 4,
        marginBottom: 10,
    },
    switcherButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 100,
        alignItems: 'center',
    },
    switcherButtonActive: {
        backgroundColor: THEME.white,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    switcherText: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: width * 0.04,
        color: THEME.textSecondary,
    },
    switcherTextActive: {
        color: THEME.darkBlue,
    },
    scrollWrapper: {
        flex: 1,
        backgroundColor: '#EDEDED',
        borderTopLeftRadius: 50,
        borderTopRightRadius: 50,
    },
    scrollContainer: {
        paddingTop: 32,
        paddingHorizontal: 24,
        paddingBottom: 120,
    },
    mealTitle: {
        fontSize: width * 0.07,
        fontFamily: 'Montserrat-Bold',
        color: THEME.textPrimary,
        textAlign: 'center',
    },
    categoryTag: {
        backgroundColor: THEME.greenLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        alignSelf: 'center',
        marginTop: 12,
    },
    categoryText: {
        color: THEME.green,
        fontFamily: 'Montserrat-SemiBold',
        fontSize: width * 0.035,
    },
    macrosContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 24,
    },
    macroCard: {
        backgroundColor: THEME.white,
        borderRadius: 16,
        paddingVertical: 12,
        alignItems: 'center',
        width: (width - 48) / 4 - 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    macroValue: {
        fontSize: width * 0.045,
        fontFamily: 'Montserrat-Bold',
        color: THEME.textPrimary,
    },
    macroLabel: {
        fontSize: width * 0.03,
        fontFamily: 'Montserrat-Regular',
        color: THEME.textSecondary,
        marginTop: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: width * 0.05,
        fontFamily: 'Montserrat-Bold',
        color: THEME.textPrimary,
        marginBottom: 16,
    },
    ingredientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: THEME.gray,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        backgroundColor: THEME.white,
    },
    checkboxChecked: {
        backgroundColor: THEME.green,
        borderColor: THEME.green,
    },
    ingredientText: {
        fontSize: width * 0.04,
        fontFamily: 'Montserrat-Regular',
        color: THEME.textPrimary,
        flex: 1,
    },
    prepTimeCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: THEME.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    prepTimeLabel: {
        fontSize: width * 0.04,
        fontFamily: 'Montserrat-SemiBold',
        color: THEME.textSecondary,
    },
    prepTimeValue: {
        fontSize: width * 0.04,
        fontFamily: 'Montserrat-Bold',
        color: THEME.textPrimary,
    },
    stepItem: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    stepNumber: {
        fontSize: width * 0.04,
        fontFamily: 'Montserrat-Bold',
        color: THEME.textPrimary,
        marginRight: 12,
    },
    stepText: {
        fontSize: width * 0.04,
        fontFamily: 'Montserrat-Regular',
        color: THEME.textPrimary,
        flex: 1,
        lineHeight: 24,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingTop: 12,
        backgroundColor: THEME.background,
        borderTopWidth: 1,
        borderTopColor: THEME.gray,
    },
    completeButton: {
        backgroundColor: THEME.darkBlue,
        paddingVertical: 18,
        borderRadius: 100,
        alignItems: 'center',
    },
    completeButtonText: {
        color: THEME.white,
        fontSize: width * 0.045,
        fontFamily: 'Montserrat-Bold',
    },
});