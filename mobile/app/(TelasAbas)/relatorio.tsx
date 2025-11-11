// (app)/(TelasAbas)/relatorio.tsx

import React, { useState, useCallback } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { auth, db } from '@/app/firebaseConfig';
import { Utensils, CheckCircle, PieChart, Droplets, GlassWater } from 'lucide-react-native'; // Adicionado GlassWater
import firebase from 'firebase/compat/app'; // Importação para o tipo QuerySnapshot (ajuste se usar v9+)

const { width } = Dimensions.get('window');

// Componente StatCard agora aceita 'style'
const StatCard = ({ icon, label, value, unit, style }: { icon: React.ReactNode, label: string, value: string, unit: string, style?: object }) => (
    <View style={[styles.statCard, style]}>
        <View style={styles.statIcon}>{icon}</View>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statUnit}> {unit}</Text>
        </View>
    </View>
);

export default function RelatorioScreen() {
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // Não precisamos mais do estado numberOfDaysFetched, calculamos a média dentro do fetch

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    useFocusEffect(
        useCallback(() => {
            const fetchReport = async () => {
                setLoading(true);
                const user = auth.currentUser;
                if (!user) { setLoading(false); return; }

                const today = new Date();
                const startDate = new Date();
                startDate.setDate(today.getDate() - 7);
                const endDate = new Date();
                endDate.setDate(today.getDate() + 7);

                try {
                    const querySnapshot = await db.collection('users').doc(user.uid).collection('dailyData')
                        .where('__name__', '>=', formatDate(startDate))
                        .where('__name__', '<=', formatDate(endDate))
                        .get();

                    let totalMealsAccumulator = 0, completedMealsAccumulator = 0, totalCalories = 0, totalProteins = 0, totalCarbs = 0, totalFats = 0;
                    let totalAguaConsumida = 0;
                    const numberOfDays = querySnapshot.size; // Guarda o número de dias

                    querySnapshot.forEach(doc => {
                        const dayData = doc.data();
                        let plan1: any[] = [], plan2: any[] = [];

                        if (dayData && dayData.planos) {
                            plan1 = dayData.planos['1']?.refeicoes || [];
                            plan2 = dayData.planos['2']?.refeicoes || [];
                        } else if (dayData && dayData['planos.1']) {
                            plan1 = dayData['planos.1']?.refeicoes || [];
                            plan2 = dayData['planos.2']?.refeicoes || [];
                        } else if (dayData && dayData.refeicoes) {
                            plan1 = dayData.refeicoes;
                        }

                        totalMealsAccumulator += plan1.length;
                        
                        const completedPlan1 = plan1.filter((r: any) => r.completed);
                        const completedPlan2 = plan2.filter((r: any) => r.completed);
                        const allCompletedToday = [...completedPlan1, ...completedPlan2];

                        completedMealsAccumulator += allCompletedToday.length;
                        
                        allCompletedToday.forEach((meal: any) => {
                            totalCalories += meal.calorias || 0;
                            totalProteins += meal.proteinas || 0;
                            totalCarbs += meal.carboidratos || 0;
                            totalFats += meal.lipidios || 0;
                        });

                        totalAguaConsumida += Number(dayData?.aguaConsumida) || 0;
                    });

                    // Calcula as médias aqui
                    const avgCalories = completedMealsAccumulator > 0 ? totalCalories / completedMealsAccumulator : 0;
                    const avgWater = numberOfDays > 0 ? totalAguaConsumida / numberOfDays : 0;

                    setReportData({
                        totalMeals: totalMealsAccumulator, completedMeals: completedMealsAccumulator,
                        totalCalories, totalProteins, totalCarbs, totalFats,
                        totalAguaConsumida,
                        avgCalories, // Adiciona a média de calorias aos dados
                        avgWater     // Adiciona a média de água aos dados
                    });

                } catch (error) {
                    console.error("Erro ao buscar relatório:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchReport();
        }, [])
    );

    // Usa os valores diretamente do estado reportData
    const adherence = reportData?.totalMeals > 0 ? (reportData.completedMeals / reportData.totalMeals) * 100 : 0;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.headerTitle}>Relatório</Text>
                {loading ? <ActivityIndicator size="large" color="#44BC7F" style={{ marginTop: 50 }} /> :
                 !reportData || reportData.totalMeals === 0 ? <Text style={styles.noDataText}>Nenhum plano alimentar encontrado.</Text> :
                 (<>
                     <View style={styles.summaryCard}>
                         <Text style={styles.summaryTitle}>Taxa de Adesão</Text>
                         <Text style={styles.summaryPercentage}>{adherence.toFixed(0)}%</Text>
                         <View style={styles.summaryBarBackground}><View style={[styles.summaryBarForeground, { width: `${adherence}%` }]} /></View>
                         <Text style={styles.summarySubtitle}>Você concluiu {reportData.completedMeals} de {reportData.totalMeals} refeições planejadas.</Text>
                     </View>

                     <Text style={styles.sectionTitle}>Resumo Nutricional e Hidratação (Total do Período)</Text>
                     <View style={styles.statsGrid}>
                          <StatCard icon={<Utensils size={24} color="#44BC7F" />} label="Calorias Totais" value={reportData.totalCalories.toFixed(0)} unit="kcal" />
                          {/* Usa o valor de avgCalories do estado */}
                          <StatCard icon={<CheckCircle size={24} color="#44BC7F" />} label="Média Kcal/Refeição" value={(reportData.avgCalories || 0).toFixed(0)} unit="kcal" />
                          <StatCard icon={<PieChart size={24} color="#3B82F6" />} label="Proteínas Totais" value={reportData.totalProteins.toFixed(1)} unit="g" />
                          <StatCard icon={<PieChart size={24} color="#F59E0B" />} label="Carboidratos Totais" value={reportData.totalCarbs.toFixed(1)} unit="g" />
                          <StatCard icon={<Droplets size={24} color="#EF4444" />} label="Gorduras Totais" value={reportData.totalFats.toFixed(1)} unit="g" />
                          <StatCard icon={<GlassWater size={24} color="#3B82F6" />} label="Água Consumida Total" value={reportData.totalAguaConsumida.toFixed(0)} unit="ml" />
                          {/* Usa o valor de avgWater do estado e aplica o estilo */}
                          <StatCard
                              icon={<GlassWater size={24} color="#3B82F6" />}
                              label="Média Diária Água"
                              value={(reportData.avgWater || 0).toFixed(0)}
                              unit="ml/dia"
                              style={{ width: '100%' }} // Faz este card ocupar a largura toda
                          />
                     </View>
                 </>)}
            </ScrollView>
        </SafeAreaView>
    );
}

// Estilos
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: Platform.OS === 'android' ? 40 : 0 },
    scrollContainer: { padding: 20, paddingBottom: 40 },
    headerTitle: { fontFamily: 'Montserrat-Bold', fontSize: 26, color: '#1E1B3A', marginBottom: 24, textAlign: 'center' },
    noDataText: { textAlign: 'center', fontFamily: 'Montserrat-Regular', color: '#6B7280', fontSize: 16, marginTop: 50 },
    summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 32, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    summaryTitle: { fontFamily: 'Montserrat-SemiBold', fontSize: 16, color: '#6B7280' },
    summaryPercentage: { fontFamily: 'Montserrat-Bold', fontSize: 48, color: '#44BC7F', marginVertical: 8 },
    summaryBarBackground: { height: 8, width: '100%', backgroundColor: '#E5E7EB', borderRadius: 4, marginTop: 8, overflow: 'hidden' },
    summaryBarForeground: { height: '100%', backgroundColor: '#44BC7F', borderRadius: 4 },
    summarySubtitle: { fontFamily: 'Montserrat-Regular', fontSize: 14, color: '#6B7280', marginTop: 16, textAlign: 'center' },
    sectionTitle: { fontFamily: 'Montserrat-Bold', fontSize: 18, color: '#1E1B3A', marginBottom: 16 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    statCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        width: (width - 50) / 2, // 40 padding + 10 margem
        marginBottom: 10,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2
    },
    statIcon: { marginBottom: 12, backgroundColor: '#F3F4F6', padding: 8, borderRadius: 100 },
    statLabel: { fontFamily: 'Montserrat-SemiBold', fontSize: 12, color: '#6B7280', marginBottom: 4, textAlign: 'center' },
    statValue: { fontFamily: 'Montserrat-Bold', fontSize: 20, color: '#1E1B3A' },
    statUnit: { fontFamily: 'Montserrat-Regular', fontSize: 12, color: '#6B7280' },
});

