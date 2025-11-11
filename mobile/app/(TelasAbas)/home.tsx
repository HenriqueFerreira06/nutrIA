import { Ionicons } from '@expo/vector-icons'; 
import { useRouter } from 'expo-router';
import React, { useMemo, useState, useEffect, JSX } from 'react';
import {
    SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View,
    Dimensions, FlatList, ActivityIndicator, Modal, TextInput, Alert,
    TouchableWithoutFeedback, Platform, ListRenderItem,
    Image 
} from 'react-native';
import { Droplet, ChevronLeft, ChevronRight, Check, ArrowRight } from 'lucide-react-native';
import { Meal } from '../../store/data';
import { db } from '../firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

// --- INTERFACES E CONSTANTES ---
interface CarouselItem {
    type: string;
    title: string;
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    consumed: number;
    goal: number;
    unit: string;
}

const { width, height } = Dimensions.get('window');
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

const THEME = {
    background: '#F8F9FA',
    textPrimary: '#1E1B3A',
    textSecondary: '#6B7280',
    green: '#44BC7F',
    greenLight: 'rgba(68, 188, 127, 0.15)',
    blue: '#E0F2FE',
    darkBlue: '#1B0C45',
    white: '#FFFFFF',
    gray: '#E5E7EB',
    red: '#F87171',
    yellow: '#FBBF24',
    // --- CORES DO MODAL ATUALIZADAS ---
    modalCloseBtnBg: '#ff7c76', // Vermelho/Rosa do botão X
    modalInputBg: '#c9e1ff', // Azul claro do input
    modalInputPlaceholder: '#8FADDD', // Azul escuro do placeholder
    modalErrorText: '#E53E3E', // Vermelho para o erro
};
// --- FIM DAS CONSTANTES ---

// --- COMPONENTES (ProgressCard, formatKey, getIconForCategory - Sem alteração) ---
const ProgressCard = ({ title, icon, consumed, goal, unit }: CarouselItem) => {
    const progress = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
    const remaining = Math.max(goal - consumed, 0);
    const getProgressBarColor = (p: number) => {
        if (p <= 20) return THEME.red;
        if (p <= 60) return THEME.yellow;
        return THEME.green;
    };
    const progressBarColor = getProgressBarColor(progress);
    const displayConsumed = goal > 0 ? consumed.toFixed(unit === 'kcal' ? 0 : 1) : consumed.toFixed(unit === 'kcal' ? 0 : 1);
    const displayRemaining = goal > 0 ? remaining.toFixed(unit === 'kcal' ? 0 : 1) : '----';
    const displayPercentage = goal > 0 ? progress.toFixed(0) : '0';
    return (
        <View style={[styles.caloriesCard, { backgroundColor: progressBarColor + '25', width: width - 40 }]}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{title}</Text>
                <MaterialCommunityIcons name={icon} size={24} color={THEME.textPrimary} />
            </View>
            <Text style={styles.caloriesValue}>{String(displayConsumed)}{unit}</Text>
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: progressBarColor }]} />
            </View>
            <View style={styles.cardFooter}>
                <Text style={styles.footerText}>Faltam {String(displayRemaining)}{unit}</Text>
                <Text style={styles.footerPercentage}>{String(displayPercentage)}%</Text>
            </View>
        </View>
    );
};
function formatKey(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}
const getIconForCategory = (category?: string): React.ComponentProps<typeof MaterialCommunityIcons>['name'] => {
    switch (category?.toLowerCase()) {
        case 'café da manhã': return 'coffee-outline';
        case 'almoço': return 'food-variant';
        case 'jantar': return 'pot-steam-outline';
        case 'lanche': return 'food-apple-outline';
        case 'ceia': return 'weather-night';
        default: return 'food-outline';
    }
};
// --- FIM COMPONENTES ---

export default function HomeScreen() {
    const router = useRouter();
    const { user, isLoggedIn, isLoading: isAuthLoading } = useAuth();

    const [loadingData, setLoadingData] = useState(true);
    const [dataAtual, setDataAtual] = useState(new Date());
    const [dailyData, setDailyData] = useState<Record<string, any> | null>(null);
    const [isWaterModalVisible, setWaterModalVisible] = useState(false);
    const [waterInput, setWaterInput] = useState('');
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const [waterError, setWaterError] = useState('');

    const karuCoinImage = require('../../assets/images/karucoin.png'); 

    // --- Hooks useMemo (Sem alteração) ---
    const meals: Meal[] = useMemo((): Meal[] => {
        const plan1refeicoes: Meal[] = dailyData?.['planos.1']?.refeicoes || [];
        const plan2refeicoes: Meal[] = dailyData?.['planos.2']?.refeicoes || [];
        if (!plan1refeicoes.length) return [];
        const plan2MealMap = new Map<string, Meal>();
        if (Array.isArray(plan2refeicoes)) {
            plan2refeicoes.forEach(mealP2 => { if (mealP2.completed) plan2MealMap.set(mealP2.nome, mealP2); });
        }
        const mergedMeals = plan1refeicoes.map((mealP1: Meal) => {
            const completedMealP2 = plan2MealMap.get(mealP1.nome);
            let finalMeal: Meal & { _sourcePlan?: '1' | '2' };
            if (completedMealP2) finalMeal = { ...completedMealP2, _sourcePlan: '2' };
            else finalMeal = { ...mealP1, _sourcePlan: '1' };
            finalMeal.iconName = getIconForCategory(finalMeal.categoria);
            return finalMeal;
        });
        return mergedMeals;
    }, [dailyData]);
    const resumo = useMemo(() => dailyData?.['planos.1']?.resumo || null, [dailyData]);
    const temPlanoPrincipal = useMemo(() => !!(dailyData?.['planos.1']), [dailyData]);
    const consumidos = useMemo(() => {
        const plan1meals: Meal[] = dailyData?.['planos.1']?.refeicoes || [];
        const plan2meals: Meal[] = dailyData?.['planos.2']?.refeicoes || [];
        const completed1 = Array.isArray(plan1meals) ? plan1meals.filter(m => m?.completed) : [];
        const completed2 = Array.isArray(plan2meals) ? plan2meals.filter(m => m?.completed) : [];
        const allCompletedMeals = [...completed1, ...completed2];
        return {
            calorias: allCompletedMeals.reduce((sum, m) => sum + (m?.calorias || 0), 0),
            proteinas: allCompletedMeals.reduce((sum, m) => sum + (m?.proteinas || 0), 0),
            carboidratos: allCompletedMeals.reduce((sum, m) => sum + (m?.carboidratos || 0), 0),
            gorduras: allCompletedMeals.reduce((sum, m) => sum + (m?.lipidios || 0), 0),
        };
    }, [dailyData]);
    const metaCalorias = resumo?.caloriasTotais || 0;
    const metaProteinas = resumo?.proteinasTotais || 0;
    const metaCarboidratos = resumo?.carboidratosTotais || 0;
    const metaGorduras = resumo?.lipidiosTotais || 0;
    const metaAgua = resumo?.metaAgua || dailyData?.['planos.1']?.resumo?.metaAgua || 2500;
    const aguaConsumida = dailyData?.aguaConsumida || 0;
    // --- Fim Hooks useMemo ---

    // --- useEffect de carregamento de dados (Sem alteração) ---
    useEffect(() => {
        if (!isLoggedIn || !user?.uid) {
            if (!isAuthLoading) setLoadingData(false);
            setDailyData(null);
            return;
        };
        setLoadingData(true);
        const dateKey = formatKey(dataAtual);
        const dailyDocRef = db.collection('users').doc(user.uid).collection('dailyData').doc(dateKey);
        const unsubscribe = dailyDocRef.onSnapshot((docSnapshot) => {
            if (docSnapshot.exists) setDailyData(JSON.parse(JSON.stringify(docSnapshot.data())));
            else setDailyData(null);
            setLoadingData(false);
        }, (error: any) => {
             console.error("[HOME] 'onSnapshot' ERRO:", error);
             setLoadingData(false); setDailyData(null);
        });
        return () => unsubscribe();
    }, [user, dataAtual, isLoggedIn, isAuthLoading]);

    const isFutureDate = useMemo(() => { 
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const dataComparar = new Date(dataAtual); dataComparar.setHours(0, 0, 0, 0);
        return dataComparar > hoje;
    }, [dataAtual]);
    
    const progressoAgua = metaAgua > 0 ? Math.min((aguaConsumida / metaAgua) * 100, 100) : 0;
    const mudarDia = (delta: number) => { setDataAtual(d => { const n = new Date(d); n.setDate(d.getDate() + delta); return n; }); };

    // --- LÓGICA DO MODAL DE ÁGUA (Sem alteração) ---
    const handleAddWater = async () => {
        const amount = parseInt(waterInput, 10);
        if (isNaN(amount) || amount <= 0) {
            setWaterError('insira a quantidade ingerida de água.'); 
            return; 
        }
        setWaterError('');
        if (!user || !user.uid) return Alert.alert("Erro", "Usuário não encontrado.");
        
        let finalAmount = amount;
        if (amount > 4000) {
            finalAmount = 4000;
        }
        
        const dateKey = formatKey(dataAtual);
        const dailyDocRef = db.collection('users').doc(user.uid).collection('dailyData').doc(dateKey);
        const newTotalWater = (aguaConsumida || 0) + finalAmount; 
        
        try {
            await dailyDocRef.set({ aguaConsumida: newTotalWater }, { merge: true });
            setWaterInput('');
            setWaterModalVisible(false);
        } catch (error) {
            console.error("[HOME] Erro ao adicionar água:", error);
            Alert.alert("Erro", "Não foi possível salvar o consumo de água.");
        }
    };
    // --- FIM LÓGICA DO MODAL ---

    // --- Navegação e Carousel (Sem alteração) ---
    const handleNavigateToRefeicao = (meal: Meal | null) => {
        if (!meal || !meal.nome) return Alert.alert("Erro", "Não foi possível abrir os detalhes desta refeição.");
        const plan1Data = dailyData?.['planos.1'];
        const plan2Data = dailyData?.['planos.2'];
        const activePlanKey = (meal as any)._sourcePlan || '1';
        router.push({
            pathname: '/TelasVariadas/refeicao',
            params: {
                mealNome: meal.nome,
                plan1Data: plan1Data ? JSON.stringify(plan1Data) : undefined,
                plan2Data: plan2Data ? JSON.stringify(plan2Data) : undefined,
                dateKey: formatKey(dataAtual),
                activePlanKey: activePlanKey
            }
        });
    };
    const carouselData: CarouselItem[] = useMemo(() => [
        { type: 'calorias', title: 'Calorias ingeridas', icon: 'fire', consumed: consumidos.calorias, goal: metaCalorias, unit: 'kcal' },
        { type: 'proteinas', title: 'Proteínas ingeridas', icon: 'food-drumstick-outline', consumed: consumidos.proteinas, goal: metaProteinas, unit: 'g' },
        { type: 'carboidratos', title: 'Carboidratos ingeridos', icon: 'barley', consumed: consumidos.carboidratos, goal: metaCarboidratos, unit: 'g' },
        { type: 'gorduras', title: 'Gorduras ingeridas', icon: 'oil', consumed: consumidos.gorduras, goal: metaGorduras, unit: 'g' },
    ], [consumidos, metaCalorias, metaProteinas, metaCarboidratos, metaGorduras]);
    const onScroll = (event: any) => { 
        const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
        setActiveSlideIndex(slideIndex);
     };

    // --- RENDER MEAL (Sem alteração) ---
    const renderMeal: ListRenderItem<Meal> = ({ item }): JSX.Element | null => {
        if (!item) return null;
        const isCompleted = item.completed || false;
        const mealnome = item.nome || 'Refeição sem nome';
        const mealCalories = Math.round(item.calorias || 0);

        return (
            <TouchableOpacity
                style={[styles.mealItem, isCompleted && styles.mealItemCompleted]}
                activeOpacity={0.7}
                onPress={() => handleNavigateToRefeicao(item)}
            >
                <View style={[styles.mealIconContainer, isCompleted && styles.mealIconContainerCompleted]}>
                    <MaterialCommunityIcons name={item.iconName || 'food-variant'} size={28} color={isCompleted ? THEME.white : THEME.textPrimary} />
                </View>
                <View style={styles.mealInfo}>
                    <Text style={[styles.mealTitle, isCompleted && { color: THEME.white }]} numberOfLines={1} ellipsizeMode="tail">{mealnome}</Text>
                    <Text style={[styles.mealCalories, isCompleted && { color: THEME.white, opacity: 0.8 }]}>{mealCalories} kcal</Text>
                </View>
                <View style={styles.mealStatusIcon}>
                     <ArrowRight size={16} color={isCompleted ? THEME.white : THEME.textSecondary} />
                </View>
            </TouchableOpacity>
        );
    };
    
    if (isAuthLoading || (loadingData && !dailyData && !temPlanoPrincipal)) { 
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={THEME.green} /></View>;
    }

    const displayName = user?.nome || 'Usuário';

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                
                <View style={styles.header}>
                    <Text style={styles.greeting}>Olá, {displayName}!</Text>
                    <View style={styles.headerIcons}> 
                        <TouchableOpacity 
                            style={styles.headerIconButton} 
                            onPress={() => router.push('/TelasVariadas/token')} 
                        >
                            <Image source={karuCoinImage} style={styles.karuCoinIcon} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.headerIconButton} 
                            onPress={() => router.push('/(TelasAbas)/perfil')}
                        >
                            <Ionicons name="settings-outline" size={26} color={THEME.textPrimary} />
                        </TouchableOpacity>
                    </View>
                </View>
                
                <View>
                    <FlatList
                        horizontal data={carouselData} keyExtractor={(item) => item.type}
                        renderItem={({ item }) => ( <ProgressCard {...item} /> )}
                        extraData={{ consumidos, resumo }}
                        showsHorizontalScrollIndicator={false} pagingEnabled 
                        onMomentumScrollEnd={onScroll}
                        style={{ width: width }} 
                        contentContainerStyle={styles.carouselContainer} 
                        decelerationRate="fast" 
                        snapToInterval={width} 
                        snapToAlignment="center"
                    />
                    <View style={styles.paginationContainer}>
                        {carouselData.map((_: CarouselItem, index: number) => (
                            <View key={index} style={[styles.paginationDot, activeSlideIndex === index && styles.paginationDotActive]} />
                        ))}
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.waterCard}
                    onPress={() => { if (!Boolean(isFutureDate) && temPlanoPrincipal) setWaterModalVisible(true); }}
                    activeOpacity={0.8}
                    disabled={Boolean(isFutureDate) || !temPlanoPrincipal}
                >
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Você está se hidratando?</Text>
                    </View>
                    <View style={styles.waterContent}>
                        <View style={[styles.waterAddButton, !temPlanoPrincipal || isFutureDate ? { opacity: 0.5 } : undefined]}>
                           <Droplet size={24} color={THEME.textPrimary} />
                           <Text style={styles.waterAddText}>Adicionar</Text>
                        </View>
                        <View style={styles.waterProgressContainer}>
                            <View style={styles.progressBarContainer}>
                                <View style={[styles.progressBarFill, { width: `${progressoAgua}%`, backgroundColor: '#3B82F6' }]} />
                            </View>
                            <Text style={styles.waterValue}>
                                <Text style={{ fontFamily: 'Montserrat-Bold' }}>{aguaConsumida}</Text> / {metaAgua} ml
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>

                <View style={styles.listSectionContainer}>
                    <View style={styles.dateNavigator}>
                        <TouchableOpacity style={styles.dateNavButton} onPress={() => mudarDia(-1)}>
                            <ChevronLeft size={20} color={THEME.white} />
                        </TouchableOpacity>
                        <Text style={styles.dateNavText}>
                            {dataAtual.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}
                        </Text>
                        <TouchableOpacity style={styles.dateNavButton} onPress={() => mudarDia(1)}>
                            <ChevronRight size={20} color={THEME.white} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.contentBackground}>
                        {loadingData && <ActivityIndicator size="small" color={THEME.green} style={{marginTop: hp(5)}} />} 
                        {!loadingData && temPlanoPrincipal && meals.length > 0 ? (
                            <FlatList
                                data={meals} 
                                extraData={meals} 
                                keyExtractor={(item, index) => `${item?.id || index}-${(item as any)._sourcePlan || '1'}`} 
                                renderItem={renderMeal} scrollEnabled={false}
                                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                            />
                        ) : (
                           !loadingData && <Text style={styles.noMealsText}>Nenhuma refeição planejada para este dia.</Text>
                        )}
                    </View>
                </View>
            </ScrollView>
            
           
            {/* --- MODAL DE ÁGUA (REESTILIZADO) --- */}
            <Modal animationType="fade" transparent={true} visible={isWaterModalVisible} onRequestClose={() => setWaterModalVisible(false)}>
                <TouchableWithoutFeedback onPress={() => setWaterModalVisible(false)}>
                    <View style={styles.modalBackdrop}>
                        <TouchableWithoutFeedback onPress={() => {}}>
                            <View style={styles.modalCard}>
                                
                                <TouchableOpacity style={styles.modalCloseButton} onPress={() => setWaterModalVisible(false)}>
                                    {/* O X agora é branco */}
                                    <Ionicons name="close" size={24} color={THEME.white} />
                                </TouchableOpacity>
                                
                                {/* Título em linha única */}
                                <Text style={styles.modalTitle}>De 'gole' em 'gole', quantos mL já foram?</Text>
                                
                                {/* Mascote maior e alinhado à esquerda */}
                                <Image 
                                    source={require('@/assets/images/karuagua.png')} 
                                    style={styles.modalMascot}
                                />
                                
                                <View style={styles.modalInputContainer}>
                                    <TouchableOpacity 
                                        style={styles.modalAddButton} 
                                        onPress={handleAddWater}
                                    >
                                        <Text style={styles.modalAddButtonIcon}>+</Text>
                                    </TouchableOpacity>
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="Ex.: 250 (ml)"
                                        placeholderTextColor={THEME.modalInputPlaceholder}
                                        keyboardType="numeric"
                                        value={waterInput}
                                        onChangeText={(text) => {
                                            setWaterInput(text);
                                            if (text) setWaterError(''); 
                                        }}
                                        onSubmitEditing={handleAddWater}
                                    />
                                </View>
                                
                                {waterError ? (
                                    <Text style={styles.modalErrorText}>{waterError}</Text>
                                ) : (
                                    // Adiciona um espaço reservado para o erro para evitar que o layout "pule"
                                    <View style={styles.modalErrorPlaceholder} />
                                )}

                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
}


// --- ESTILOS ATUALIZADOS ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: THEME.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background },
    scrollContainer: { flexGrow: 1, paddingBottom: 0 },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: hp(3), 
        paddingHorizontal: wp(5), 
        paddingTop: Platform.OS === 'android' ? hp(5) : hp(2.5) 
    },
    greeting: { 
        fontSize: wp(5.5), 
        fontFamily: 'Montserrat-Bold', 
        color: THEME.textPrimary,
        flex: 1, 
    },
    headerIcons: { 
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconButton: { 
        padding: wp(1.5),
        marginLeft: wp(2), 
    },
    karuCoinIcon: { 
        width: 47.5, 
        height: 47.5, 
        resizeMode: 'contain',
    },
    caloriesCard: { 
        borderRadius: 20, 
        padding: wp(4), 
        marginHorizontal: wp(5), 
        marginBottom: hp(1),
    },
    carouselContainer: {},
    paginationContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: hp(2) },
    paginationDot: { width: wp(2), height: wp(2), borderRadius: wp(1), backgroundColor: THEME.gray, marginHorizontal: wp(1) },
    paginationDotActive: { backgroundColor: THEME.darkBlue, width: wp(2.6), height: wp(2.6), borderRadius: wp(1.3) },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontSize: wp(4), fontFamily: 'Montserrat-SemiBold', color: THEME.textPrimary },
    caloriesValue: { fontSize: wp(8), fontFamily: 'Montserrat-Bold', color: THEME.textPrimary, marginVertical: hp(1) },
    progressBarContainer: { height: hp(1), backgroundColor: THEME.gray, borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: hp(1) },
    footerText: { fontSize: wp(3.5), fontFamily: 'Montserrat-Regular', color: THEME.textSecondary },
    footerPercentage: { fontSize: wp(3.5), fontFamily: 'Montserrat-Bold', color: THEME.textPrimary },
    waterCard: { backgroundColor: THEME.blue, borderRadius: 20, padding: wp(4), marginHorizontal: wp(5), marginBottom: hp(2) },
    waterContent: { flexDirection: 'row', alignItems: 'center', marginTop: hp(1), gap: wp(4) },
    waterAddButton: { alignItems: 'center', gap: hp(0.5) },
    waterAddText: { fontFamily: 'Montserrat-SemiBold', color: THEME.textPrimary, fontSize: wp(3.5) },
    waterProgressContainer: { flex: 1 },
    waterValue: { fontSize: wp(3.8), fontFamily: 'Montserrat-Regular', color: THEME.textSecondary, textAlign: 'right', marginTop: hp(0.5) },
    listSectionContainer: { flex: 1, marginTop: hp(1.5) },
    contentBackground: { flex: 1, backgroundColor: THEME.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: wp(5), paddingTop: hp(9), shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 10, minHeight: hp(40) },
    dateNavigator: { position: 'absolute', top: hp(1.25), left: 0, right: 0, zIndex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: THEME.darkBlue, borderRadius: 100, paddingVertical: hp(1.2), marginHorizontal: wp(5) },
    dateNavButton: { padding: wp(2) },
    dateNavText: { color: THEME.white, fontFamily: 'Montserrat-Bold', fontSize: wp(4.2) },
    mealItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.white, borderRadius: 16, padding: wp(3), borderWidth: 1, borderColor: THEME.gray },
    mealItemCompleted: { backgroundColor: THEME.green, borderColor: 'transparent' },
    mealIconContainer: { width: wp(12), height: wp(12), borderRadius: wp(4), backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center' },
    mealIconContainerCompleted: { backgroundColor: 'rgba(255,255,255,0.2)' },
    mealInfo: { flex: 1, marginLeft: wp(3), marginRight: wp(2) },
    mealTitle: { fontSize: wp(4), fontFamily: 'Montserrat-Bold', color: THEME.textPrimary }, 
    mealCalories: { fontSize: wp(3.5), fontFamily: 'Montserrat-Regular', color: THEME.textSecondary, marginTop: hp(0.5) },
    mealStatusIcon: { width: wp(9), height: wp(9), borderRadius: wp(4.5), justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
    noMealsText: { textAlign: 'center', fontFamily: 'Montserrat-Regular', color: THEME.textSecondary, marginTop: hp(5), fontSize: wp(4) },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: wp(6) },
    modalCard: { 
        width: '100%', 
        backgroundColor: THEME.white, 
        borderRadius: 20, 
        paddingBottom: hp(3), // Padding inferior
        alignItems: 'center', // Centraliza itens horizontalmente
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalCloseButton: {
        position: 'absolute',
        top: wp(3),
        right: wp(3),
        padding: wp(1.5), // Padding menor
        backgroundColor: THEME.modalCloseBtnBg, // Fundo vermelho/rosa
        borderRadius: 100, // Círculo
    },
    modalTitle: { 
        fontSize: wp(4.5), // Fonte menor para caber
        fontFamily: 'Poppins-Regular', 
        color: THEME.textPrimary, 
        textAlign: 'center',
        marginTop: hp(8), // Mais espaço para o botão de fechar
        marginBottom: hp(2),
        paddingHorizontal: wp(2), // Garante que o texto não bata nas bordas
    },
    modalMascot: {
        width: wp(55), // Imagem maior
        height: wp(55), // Imagem maior
        resizeMode: 'contain',
        marginBottom: hp(3), // Alinha à esquerda
        marginLeft: wp(2), // Pequeno recuo da borda
    },
    modalInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Centraliza o conjunto botão+input
        width: '100%', // Ocupa 100% do card
        paddingHorizontal: wp(10), // Espaçamento nas laterais
    },
    modalAddButton: {
        backgroundColor: THEME.darkBlue, 
        height: wp(14), // Altura fixa
        width: wp(14), // Largura fixa (para ser quadrado)
        borderTopLeftRadius: 10, // Arredondado à esquerda
        borderBottomLeftRadius: 10, // Arredondado à esquerda
        justifyContent: 'center', // Centraliza o '+'
        alignItems: 'center', // Centraliza o '+'
    },
    modalAddButtonIcon: {
        color: THEME.white,
        fontSize: wp(7), // '+' maior
        fontFamily: 'Poppins-Regular',
        lineHeight: wp(8), // Ajuste fino vertical
    },
    modalInput: { 
        height: wp(14), // Altura fixa (igual ao botão)
        width: wp(25.5),  // Largura fixa (tamanho do placeholder)
        backgroundColor: THEME.modalInputBg, 
        borderTopRightRadius: 10, // Arredondado à direita
        borderBottomRightRadius: 10, // Arredondado à direita
        paddingHorizontal: wp(4), 
        fontSize: wp(4), 
        fontFamily: 'Poppins-Regular', 
        color: THEME.textPrimary,
    },
    modalErrorText: {
        fontSize: wp(3.5),
        fontFamily: 'Poppins-Regular', 
        color: THEME.modalErrorText, // Vermelho
        marginTop: hp(1.5),
        textAlign: 'center',
    },
    // Espaço reservado para o erro (evita "pulos" no layout)
    modalErrorPlaceholder: {
        height: hp(1.5) + (wp(3.5) * 1.2), 
        marginTop: hp(1.5),
    },
});