// app/(TelasVariadas)/produto.tsx - CÓDIGO CORRIGIDO
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Platform,
    ScrollView,
    Modal,
    TextInput,
    ScrollView as ModalScrollView,
    ActivityIndicator,
    Alert, // Import Alert
    KeyboardAvoidingView,
    TouchableWithoutFeedback // <-- ADICIONADO
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS
} from 'react-native-reanimated';
import firebase from 'firebase/compat/app';
import { db, auth } from '@/app/firebaseConfig'; // Verifique se o path está correto

// --- TEMA DE CORES ---
const THEME = {
    background: '#EDEDED', card: '#FFFFFF', textPrimary: '#1B0C45', textSecondary: '#6A6591', textMicroValue: '#8C8994', red: '#FF3737', green: '#44BC7F', caloryText: '#FF3737', caloryBg: '#FF373747', proteinText: '#A8BA31', proteinBg: '#A8BA315C', carbText: '#D377E5', carbBg: '#D377E594', fatText: '#F3870D', fatBg: '#F3870D3B', tagBackground: '#E5E7EB',
};

// --- TIPOS ---
type Produto = { id: string; code: string; nome?: string; quantidade: number; imagem?: string; nutriments?: NutrimentsAPI; ecoscore_grade?: string; serving_size?: string; expiration_date?: string | null; };
type NutrimentsAPI = {
    'energy-kcal_serving'?: number; 'energy-kcal_serving_unit'?: string; proteins_serving?: number; proteins_serving_unit?: string; carbohydrates_serving?: number; carbohydrates_serving_unit?: string; fat_serving?: number; fat_serving_unit?: string; 'saturated-fat_serving'?: number; 'saturated-fat_serving_unit'?: string; 'trans-fat_serving'?: number; 'trans-fat_serving_unit'?: string; fiber_serving?: number; fiber_serving_unit?: string; sodium_serving?: number; sodium_serving_unit?: string; sugars_serving?: number; sugars_serving_unit?: string; 'added-sugars_serving'?: number; 'added-sugars_serving_unit'?: string;
};
type ProductAPI = {
    product_name?: string; quantity?: string; image_front_url?: string; nutriments?: NutrimentsAPI; nutrition_grades_tags?: string[]; expiration_date?: string;
    serving_size?: string; ecoscore_grade?: string;
};

// --- COMPONENTES REUTILIZÁVEIS ---
const NutrientStat = React.memo(({ label, value, unit, text_color, bg_color }: { label: string; value: number | undefined; unit: string | undefined; text_color: string; bg_color: string }): React.JSX.Element => {
    const val = value || 0; const u = unit || (label === 'Calorias' ? 'kcal' : 'g'); let displayValue: string;
    if (u === 'kcal') displayValue = Math.round(val).toString();
    else { if (val === 0) displayValue = "0"; else if (val < 1) displayValue = val.toFixed(2).replace(/\.?0+$/, ""); else if (val < 10) displayValue = val.toFixed(1); else displayValue = Math.round(val).toString(); }
    return ( <View style={[styles.nutrientStat, { backgroundColor: bg_color }]}><Text style={[styles.nutrientStatLabel, { color: text_color }]}>{label} ({u})</Text><Text style={styles.nutrientStatValue}>{displayValue}</Text></View> );
});
const InfoRow = React.memo(({ label, value, unit }: { label: string; value: number | undefined; unit: string | undefined; }): React.JSX.Element => {
    const val = value || 0; const u = unit || 'g'; let displayValue: string; let displayUnit = u;
    if (u === 'g' && val > 0 && val < 1) { displayValue = (val * 1000).toFixed(0); displayUnit = 'mg'; }
    else { if (val === 0) displayValue = "0"; else if (val < 10) displayValue = val.toFixed(1); else displayValue = Math.round(val).toString(); }
    return ( <View style={styles.infoRow}><Text style={styles.infoRowLabel}>{label}</Text><Text style={styles.infoRowValue}>{displayValue} {displayUnit}</Text></View> );
});
const InfoCard = React.memo(({ children, style }: { children: React.ReactNode; style?: object }): React.JSX.Element => ( <View style={[styles.infoCard, style]}>{children}</View> ));
const QualityScoreCard = React.memo(({ score }: { score?: string }): React.JSX.Element => {
    let iconName: keyof typeof Ionicons.glyphMap = 'help-circle-outline'; let color = THEME.textSecondary; let text = "Nível de qualidade";
    switch (score) { case 'a': iconName = 'happy-outline'; color = THEME.green; text = "Qualidade: A"; break; case 'b': iconName = 'happy-outline'; color = '#90C956'; text = "Qualidade: B"; break; case 'c': iconName = 'sad-outline'; color = '#F3B40D'; text = "Qualidade: C"; break; case 'd': iconName = 'sad-outline'; color = THEME.fatText; text = "Qualidade: D"; break; case 'e': case 'f': iconName = 'warning-outline'; color = THEME.red; text = `Qualidade: ${score ? score.toUpperCase() : 'E'}`; break; default: iconName = 'help-circle-outline'; color = THEME.textSecondary; text = "Qualidade (N/A)"; break; }
    return ( <InfoCard style={{ justifyContent: 'center', gap: 8 }}><Text style={styles.cardLabel}>{text}</Text><Ionicons name={iconName} size={32} color={color} /></InfoCard> );
});
const Checkbox = React.memo(({ label, isChecked, onPress }: { label: string; isChecked: boolean; onPress: () => void }): React.JSX.Element => (
    <TouchableOpacity style={modalStyles.checkboxContainer} onPress={onPress}>
        <View style={[modalStyles.checkbox, isChecked && modalStyles.checkedCheckbox]} />
        <Text style={modalStyles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
));

type AnimatedInputGroupProps = {
    field: string; isVisible: boolean; fieldValues: Record<string, string>; handleFieldValueChange: (field: string, text: string) => void; fieldUnits: Record<string, string>; handleUnitChange: (field: string, unit: string) => void; openDropdownField: string | null; setOpenDropdownField: React.Dispatch<React.SetStateAction<string | null>>; unitOptions: string[];
};

const AnimatedInputGroup = ({ field, isVisible, fieldValues, handleFieldValueChange, fieldUnits, handleUnitChange, openDropdownField, setOpenDropdownField, unitOptions }: AnimatedInputGroupProps): React.JSX.Element => {
    const opacity = useSharedValue(0); const translateY = useSharedValue(-10);
    
    useEffect(() => { 
        if (isVisible) { 
            opacity.value = withTiming(1, { duration: 300 }); 
            translateY.value = withTiming(0, { duration: 300 }); 
        } else { 
            opacity.value = withTiming(0, { duration: 200 }); 
            translateY.value = withTiming(-10, { duration: 200 }); 
        } 
    }, [isVisible]);

    const animatedStyle = useAnimatedStyle(() => ({ 
        opacity: opacity.value, 
        transform: [{ translateY: translateY.value }], 
        // pointerEvents continua importante aqui para desativar cliques quando invisível
        pointerEvents: opacity.value > 0 ? 'auto' : 'none' 
    }));

    const isDropdownOpen = openDropdownField === field; 
    const selectedUnit = fieldUnits[field] || (field === 'Calorias' ? 'kcal' : 'g');
    
    return (
        // O Animated.View agora é o container direto dos inputs e do dropdown
        <Animated.View style={[modalStyles.inputGroupContainer, animatedStyle]}>
            <TextInput 
                style={modalStyles.fieldValueInput} 
                placeholder="Valor" 
                keyboardType="numeric" 
                value={fieldValues[field] || ''} 
                onChangeText={(text) => handleFieldValueChange(field, text)} 
            />
            {/* View intermediária com zIndex removida */}
            <TouchableOpacity 
                style={modalStyles.unitSelectorButton} 
                onPress={() => setOpenDropdownField(isDropdownOpen ? null : field)} 
            >
                <Text style={modalStyles.unitSelectorButtonText}>{selectedUnit}</Text>
                <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color={THEME.textSecondary} />
            </TouchableOpacity>
            {isDropdownOpen && (
                // O Dropdown já tem position absolute e zIndex no estilo
                <View style={modalStyles.unitDropdownList}> 
                    {unitOptions.map((unit: string) => ( 
                        <TouchableOpacity 
                            key={unit} 
                            style={modalStyles.unitDropdownItem} 
                            onPress={() => { handleUnitChange(field, unit); setOpenDropdownField(null); }} 
                        > 
                            <Text style={modalStyles.unitDropdownItemText}>{unit}</Text> 
                        </TouchableOpacity> 
                    ))}
                </View>
            )}
        </Animated.View>
    );
};


export default function ProdutoScreen(): React.JSX.Element | null {
    const router = useRouter();
    const params = useLocalSearchParams<{ produto: string }>();

    const [produto, setProduto] = useState<Produto | null>(null);
    const [displayQuantidade, setDisplayQuantidade] = useState<number>(1);
    const [apiData, setApiData] = useState<ProductAPI | null>(null);
    const [loadingApi, setLoadingApi] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    const [isEditingDate, setIsEditingDate] = useState(false);
    const [editDateText, setEditDateText] = useState('');
    const dateInputRef = useRef<TextInput>(null);

    const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [fieldUnits, setFieldUnits] = useState<Record<string, string>>({});
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
    const [openDropdownField, setOpenDropdownField] = useState<string | null>(null);

    const nutritionFields = [ "Calorias", "Proteínas", "Carboidratos", "Gorduras Totais", "Gorduras saturadas", "Gorduras trans", "Fibras", "Sódio", "Açúcares totais", "Açúcares adicionados", "Valor da porção" ];
    const unitOptions = ['g', 'mg', 'ml', 'kcal'];

     useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => setUserId(user ? user.uid : null));
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (params.produto) {
            try {
                const produtoFromParams: Produto = JSON.parse(params.produto);
                setProduto(produtoFromParams);
                setDisplayQuantidade(produtoFromParams.quantidade);
                fetchProdutoFromApi(produtoFromParams.code);
            } catch (e) {
                console.error("Erro ao parsear produto dos parâmetros:", e);
                Alert.alert("Erro", "Não foi possível carregar os dados do produto.");
                if(router.canGoBack()) router.back();
            }
        } else if (!produto){
             Alert.alert("Erro", "Produto não especificado.");
             if(router.canGoBack()) router.back();
        }
    }, [params.produto]);

    const fetchProdutoFromApi = useCallback(async (code: string) => {
        if (!code) return;
        setLoadingApi(true);
        try {
            const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
            const json: { product?: ProductAPI; status: number } = await res.json();
            if (json.status !== 0 && json.product) {
                setApiData(json.product);
                if (userId) {
                    const productRef = db.collection('users').doc(userId).collection('products').doc(code);
                    const cacheUpdateData: Partial<Produto> & { lastApiUpdate?: firebase.firestore.FieldValue } = {
                        nome: json.product.product_name || produto?.nome || 'Nome Indisponível',
                        imagem: json.product.image_front_url || produto?.imagem || 'https://via.placeholder.com/150',
                        nutriments: json.product.nutriments ?? undefined,
                        ecoscore_grade: json.product.ecoscore_grade ?? undefined,
                        serving_size: json.product.serving_size ?? undefined,
                        lastApiUpdate: firebase.firestore.FieldValue.serverTimestamp()
                    };
                     Object.keys(cacheUpdateData).forEach((key) => { const typedKey = key as keyof typeof cacheUpdateData; if (cacheUpdateData[typedKey] === undefined) { delete cacheUpdateData[typedKey]; } });
                    productRef.set(cacheUpdateData, { merge: true }) .catch(err => console.error(`Erro ao atualizar cache Firestore para ${code}:`, err));
                }
            } else { setApiData(null); }
        } catch (e) { console.error('Erro ao buscar produto da API:', e); setApiData(null); }
        finally { setLoadingApi(false); }
    }, [userId, produto]);

    const alterarQuantidade = async (novoValor: number) => {
        const novaQtd = Math.max(0, novoValor);
        const previousQuantidade = displayQuantidade;
        setDisplayQuantidade(novaQtd);
        if (!userId || !produto) return;
        const productRef = db.collection('users').doc(userId).collection('products').doc(produto.code);
        try { await productRef.update({ quantidade: novaQtd }); }
        catch (error) { console.error("Erro ao atualizar quantidade no Firestore:", error); Alert.alert("Erro", "Não foi possível salvar a nova quantidade."); setDisplayQuantidade(previousQuantidade); }
    };

     const salvarDataValidade = async (novaData: string | null) => {
        if (!userId || !produto) return;

        let finalData: string | null = null;
        let dataValida = false;

        if (!novaData) { // Se a data for limpa (null ou string vazia)
            finalData = null;
            dataValida = true; // Limpar é sempre válido
        } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(novaData)) {
            // ### INÍCIO VALIDAÇÃO 5 ANOS ###
            const parts = novaData.split('/');
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Mês é 0-indexed
            const year = parseInt(parts[2], 10);
            const enteredDate = new Date(year, month, day);

            // Verifica se a data criada é válida (evita datas como 31/02/2025)
            if (enteredDate.getFullYear() !== year || enteredDate.getMonth() !== month || enteredDate.getDate() !== day) {
                 Alert.alert("Data Inválida", "Por favor, insira dia, mês e ano válidos.");
                 return; // Não salva
            }

            const hoje = new Date();
            const limiteInferior = new Date();
            limiteInferior.setFullYear(hoje.getFullYear() - 5);
            // Zera hora/min/seg para comparar apenas a data
            limiteInferior.setHours(0, 0, 0, 0);
            enteredDate.setHours(0, 0, 0, 0);


            if (enteredDate < limiteInferior) {
                Alert.alert("Data Inválida", "A data de validade não pode ser anterior a 5 anos atrás.");
                return; // Não salva
            }
            // ### FIM VALIDAÇÃO 5 ANOS ###
            finalData = novaData; // Data é válida
            dataValida = true;
        } else {
             Alert.alert("Formato Inválido", "Use o formato DD/MM/AAAA.");
             return; // Formato inválido, não salva
        }


        // Salva no Firestore apenas se a data for válida (ou nula)
        if (dataValida) {
            const productRef = db.collection('users').doc(userId).collection('products').doc(produto.code);
            try {
                await productRef.update({ expiration_date: finalData });
                setProduto(prev => prev ? { ...prev, expiration_date: finalData } : null); // Atualiza estado local
                // Alert.alert("Sucesso", "Data de validade atualizada."); // Opcional
            } catch (error) {
                console.error("Erro ao atualizar data de validade:", error);
                Alert.alert("Erro", "Não foi possível salvar a data de validade.");
            }
        }
    };

    const formatarData = (dataStr: string | undefined | null): string => {
        if (!dataStr) return 'Não disponível';
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) return dataStr;
        const isoMatch = dataStr.match(/^(\d{4})-(\d{2})-(\d{2})/); if (isoMatch) { const [, year, month, day] = isoMatch; return `${day}/${month}/${year}`; }
        return dataStr;
    };

    const handleEditDate = () => {
        setEditDateText(formatarData(produto?.expiration_date) === 'Não disponível' ? '' : (produto?.expiration_date || ''));
        setIsEditingDate(true);
        setTimeout(() => dateInputRef.current?.focus(), 100);
    };

    const formatDateInput = (text: string): string => {
        const digits = text.replace(/\D/g, ''); const len = digits.length;
        if (len === 0) return ''; if (len <= 2) return digits; if (len <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
        return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    };

    const handleDateInputChange = (text: string) => {
        const formatted = formatDateInput(text);
        setEditDateText(formatted);
    };

    const handleSaveDate = () => {
        setIsEditingDate(false);
        salvarDataValidade(editDateText || null); // Chama a função que valida e salva
    };

    // --- FUNÇÕES DO MODAL CORRIGIDAS ---
    const toggleFieldSelection = (field: string) => {
        setSelectedFields((prev) =>
            prev.includes(field)
                ? prev.filter((f) => f !== field) // Remove o campo
                : [...prev, field] // Adiciona o campo
        );
        // Limpa os valores se o campo for desmarcado
        if (fieldValues[field]) {
            handleFieldValueChange(field, '');
        }
    };

    const handleUnitChange = (field: string, unit: string) => {
        setFieldUnits((prev) => ({
            ...prev,
            [field]: unit,
        }));
    };

    const handleFieldValueChange = (field: string, text: string) => {
        // Permite apenas números e um ponto decimal
        const sanitizedText = text.replace(/[^0-9.]/g, '');
        setFieldValues((prev) => ({
            ...prev,
            [field]: sanitizedText,
        }));
    };

    const handleSendError = () => {
        // TODO: Adicionar lógica real de envio para o Firebase/backend
        console.log("Reportando erro:", {
            produtoCode: produto?.code,
            camposSelecionados: selectedFields,
            valores: fieldValues,
            unidades: fieldUnits,
        });

        // Lógica principal: Fechar e resetar o modal
        setShowErrorModal(false); // Fecha o modal
        setOpenDropdownField(null); // Fecha qualquer dropdown
        setSelectedFields([]); // Limpa campos selecionados
        setFieldValues({}); // Limpa valores
        setFieldUnits({}); // Limpa unidades

        // Mensagem de sucesso
        Alert.alert("Obrigado!", "Seu relatório de erro foi enviado para revisão.");
    };


    if (!produto) {
        return <SafeAreaView style={styles.safeArea}><ActivityIndicator size="large" color={THEME.green} style={{flex: 1}}/></SafeAreaView>;
    }

    const currentNutriments = apiData?.nutriments || produto.nutriments || {};
    const currentServingSize = apiData?.serving_size || produto.serving_size;
    const currentEcoScore = apiData?.ecoscore_grade || produto.ecoscore_grade;
    const currentImage = apiData?.image_front_url || produto.imagem;
    const currentName = apiData?.product_name || produto.nome;
    const currentQuantityLabel = apiData?.quantity;

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0} >
                <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={28} color={THEME.textPrimary} /></TouchableOpacity>
                        <Text style={styles.headerTitle}>Ver produto</Text>
                        <View style={{ width: 28, alignItems: 'center' }}>{loadingApi && <ActivityIndicator size="small" color={THEME.textSecondary} />}</View>
                    </View>
                    <Image source={{ uri: currentImage || 'https://via.placeholder.com/150' }} style={styles.productImage}/>
                    <View style={styles.productTitleContainer}>
                        <Text style={styles.productName} numberOfLines={2}>{currentName || 'Carregando...'} {currentQuantityLabel ? `- ${currentQuantityLabel}` : ''}</Text>
                        <TouchableOpacity onPress={() => setShowErrorModal(true)}><Ionicons name="warning-outline" size={20} color={THEME.red} style={{ marginLeft: 8 }}/></TouchableOpacity>
                    </View>
                    <View style={styles.codeContainer}><Text style={styles.productCode}>{produto.code}</Text></View>
                    <Text style={styles.portionText}>Informações nutricionais por {currentServingSize || 'porção (não especificada)'}</Text>
                    <View style={styles.nutrientContainer}>
                        <NutrientStat label="Calorias" value={currentNutriments['energy-kcal_serving']} unit={currentNutriments['energy-kcal_serving_unit']} bg_color={THEME.caloryBg} text_color={THEME.caloryText}/>
                        <NutrientStat label="Proteínas" value={currentNutriments.proteins_serving} unit={currentNutriments.proteins_serving_unit} bg_color={THEME.proteinBg} text_color={THEME.proteinText}/>
                        <NutrientStat label="Carbs" value={currentNutriments.carbohydrates_serving} unit={currentNutriments.carbohydrates_serving_unit} bg_color={THEME.carbBg} text_color={THEME.carbText}/>
                        <NutrientStat label="Gorduras Totais" value={currentNutriments.fat_serving} unit={currentNutriments.fat_serving_unit} bg_color={THEME.fatBg} text_color={THEME.fatText}/>
                    </View>
                    <View style={styles.infoListContainer}>
                        <InfoRow label="Gorduras saturadas" value={currentNutriments['saturated-fat_serving']} unit={currentNutriments['saturated-fat_serving_unit']} />
                        <InfoRow label="Gorduras trans" value={currentNutriments['trans-fat_serving']} unit={currentNutriments['trans-fat_serving_unit']} />
                        <InfoRow label="Fibras" value={currentNutriments.fiber_serving} unit={currentNutriments.fiber_serving_unit} />
                        <InfoRow label="Sódio" value={currentNutriments.sodium_serving} unit={currentNutriments.sodium_serving_unit} />
                        <InfoRow label="Açúcares totais" value={currentNutriments.sugars_serving} unit={currentNutriments.sugars_serving_unit} />
                        <InfoRow label="Açúcares adicionados" value={currentNutriments['added-sugars_serving']} unit={currentNutriments['added-sugars_serving_unit']} />
                    </View>
                    <View style={styles.footerContainer}>
                        <QualityScoreCard score={currentEcoScore} />
                        <InfoCard style={{ justifyContent: 'center' }}>
                            <Text style={styles.cardLabel}>Meu estoque</Text>
                            <Text style={styles.stockQuantity}>{displayQuantidade}</Text>
                            <View style={styles.stockControls}>
                                <TouchableOpacity onPress={() => alterarQuantidade(displayQuantidade + 1)} hitSlop={10}><Text style={styles.stockButtonText}>+</Text></TouchableOpacity>
                                <TouchableOpacity onPress={() => alterarQuantidade(displayQuantidade - 1)} hitSlop={10}><Text style={styles.stockButtonText}>-</Text></TouchableOpacity>
                            </View>
                        </InfoCard>
                        <InfoCard style={{ justifyContent: 'center', gap: 8 }}>
                             <TouchableOpacity style={styles.dateLabelContainer} onPress={handleEditDate} disabled={isEditingDate}>
                                 <Text style={styles.cardLabel}>Data de validade</Text>
                                 {!isEditingDate && <Ionicons name="pencil-outline" size={14} color={THEME.textPrimary} style={{ marginLeft: 3 }} />}
                            </TouchableOpacity>
                            {isEditingDate ? (
                                <TextInput
                                    ref={dateInputRef}
                                    style={styles.dateInput}
                                    value={editDateText}
                                    onChangeText={handleDateInputChange}
                                    onBlur={handleSaveDate}
                                    keyboardType="numeric"
                                    maxLength={10}
                                    placeholder="DD/MM/AAAA"
                                    placeholderTextColor={THEME.textSecondary}
                                    onSubmitEditing={handleSaveDate}
                                    autoFocus={true}
                                />
                            ) : (
                                <Text style={styles.expirationDate}>
                                    {formatarData(produto.expiration_date)}
                                </Text>
                            )}
                        </InfoCard>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* --- MODAL CORRIGIDO --- */}
            <Modal animationType="fade" transparent={true} visible={showErrorModal} onRequestClose={() => {setShowErrorModal(false); setOpenDropdownField(null);}}>
                {/* 1. Este é o fundo escuro (backdrop). Clicar aqui fecha o modal. */}
                <TouchableWithoutFeedback onPress={() => {setShowErrorModal(false); setOpenDropdownField(null);}}>
                    <View style={modalStyles.centeredView}>
                        
                        {/* 2. Este "captura" o clique no card, impedindo que feche o modal. */}
                        <TouchableWithoutFeedback onPress={() => {}}> 
                            {/* 3. O card em si agora é um <View>, não mais um TouchableOpacity. */}
                            <View style={modalStyles.modalView}> 
                                <TouchableOpacity style={modalStyles.closeButton} onPress={() => {setShowErrorModal(false); setOpenDropdownField(null);}}><Ionicons name="close" size={24} color={THEME.textSecondary} /></TouchableOpacity>
                                <Text style={modalStyles.modalTitle}>Encontrou um erro?</Text>
                                <ExpoImage source={require('@/assets/images/KaruErro.png')} style={modalStyles.modalImage} contentFit="contain"/>
                                <Text style={modalStyles.modalDescription}>preencha as informações a respeito do produto para que nossa equipe faça a revisão!</Text>
                                <View style={modalStyles.divider} />
                                <ModalScrollView
                                    style={modalStyles.formScrollView}
                                    contentContainerStyle={modalStyles.formScrollContent}
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="always"
                                    scrollEventThrottle={16}
                                >
                                    <Text style={modalStyles.modalSubtitle}>Quais campos estão incorretos/incompletos?</Text>
                                    <View style={modalStyles.checkboxList}>
                                        {nutritionFields.map((field) => (
                                            <View key={field} style={[ modalStyles.checkboxRowWrapper, { zIndex: openDropdownField === field ? 10 : 1 } ]}>
                                                <View style={modalStyles.checkboxRow}>
                                                    <Checkbox label={field} isChecked={selectedFields.includes(field)} onPress={() => toggleFieldSelection(field)} />
                                                    <AnimatedInputGroup
                                                        field={field}
                                                        isVisible={selectedFields.includes(field)}
                                                        fieldValues={fieldValues}
                                                        handleFieldValueChange={handleFieldValueChange}
                                                        fieldUnits={fieldUnits}
                                                        handleUnitChange={handleUnitChange}
                                                        openDropdownField={openDropdownField}
                                                        setOpenDropdownField={setOpenDropdownField}
                                                        unitOptions={unitOptions}
                                                    />
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                    <View style={modalStyles.sendButtonContainer}>
                                        <TouchableOpacity style={modalStyles.sendButton} onPress={handleSendError}>
                                            <Text style={modalStyles.sendButtonText}>Enviar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </ModalScrollView>
                            </View> 
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: THEME.background, paddingTop: Platform.OS === 'android' ? 40 : 0 },
    scrollContainer: { paddingHorizontal: 20, paddingBottom: 50, flexGrow: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    headerTitle: { fontSize: 20, fontFamily: 'Montserrat-Medium', color: THEME.textPrimary },
    productImage: { width: 150, height: 150, alignSelf: 'center', marginBottom: 20, resizeMode: 'contain' },
    productTitleContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5, },
    productName: { fontSize: 22, fontFamily: 'Montserrat-Medium', textAlign: 'left', color: THEME.textPrimary, flex: 1, marginRight: 5 },
    codeContainer: { alignSelf: 'flex-start', backgroundColor: THEME.tagBackground, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 8 },
    productCode: { fontSize: 14, color: THEME.textSecondary },
    portionText: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: THEME.textSecondary, textAlign: 'left', alignSelf: 'flex-start', marginBottom: 24 },
    nutrientContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    nutrientStat: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center', marginHorizontal: 5, minHeight: 70 },
    nutrientStatLabel: { fontSize: 12, fontFamily: 'Poppins-Regular', marginBottom: 4, textAlign: 'center' },
    nutrientStatValue: { fontSize: 22, fontFamily: 'Poppins-SemiBold', color: THEME.textPrimary },
    infoListContainer: { marginBottom: 24 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: THEME.card, borderRadius: 8, padding: 16, marginBottom: 8, alignItems: 'center' },
    infoRowLabel: { fontSize: 14, fontFamily: 'Poppins-Regular', color: THEME.textSecondary, flexShrink: 1, marginRight: 10 },
    infoRowValue: { fontSize: 14, fontFamily: 'Poppins-Regular', color: THEME.textMicroValue, fontWeight: 'bold', textAlign: 'right' },
    footerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    infoCard: { flex: 1, backgroundColor: THEME.card, borderRadius: 10, padding: 12, alignItems: 'center', marginHorizontal: 5, minHeight: 110, justifyContent: 'center' },
    cardLabel: { fontSize: 13, fontFamily: 'Poppins-Regular', color: THEME.textPrimary, fontWeight: '500', textAlign: 'center' },
    stockQuantity: { fontSize: 32, fontFamily: 'Poppins-SemiBold', color: THEME.red, marginVertical: 4 },
    stockControls: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 5},
    stockButtonText: { fontSize: 24, color: THEME.textSecondary, fontWeight: 'bold'},
    dateLabelContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    expirationDate: { fontSize: 16, fontFamily: 'Poppins-Regular', color: THEME.green, fontWeight: 'bold', textAlign: 'center', minHeight: 25 },
    dateInput: {
        fontSize: 16, fontFamily: 'Poppins-Regular', color: THEME.textPrimary, fontWeight: 'bold', textAlign: 'center', borderBottomWidth: 1, borderColor: THEME.green, paddingBottom: 2, minWidth: 100, minHeight: 25
    },
});

const modalStyles = StyleSheet.create({
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', },
    modalView: { width: '90%', maxHeight: '85%', backgroundColor: THEME.background, borderRadius: 20, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, },
    closeButton: { position: 'absolute', top: 15, right: 15, zIndex: 110, padding: 5 },
    modalTitle: { fontSize: 22, fontFamily: 'Montserrat-Medium', color: THEME.textPrimary, marginBottom: 15, },
    modalImage: { width: 180, height: 180, marginBottom: 15, },
    modalDescription: { fontSize: 14, fontFamily: 'Poppins-Regular', color: THEME.textPrimary, textAlign: 'center', lineHeight: 20, marginBottom: 20, marginHorizontal: 10, },
    divider: { height: 1, width: '100%', backgroundColor: '#D1D5DB', marginVertical: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 1, opacity: 0.7 },
    formScrollView: { width: '100%', flexShrink: 1, flexGrow: 1 },
    formScrollContent: { paddingBottom: 30, },
    modalSubtitle: { fontSize: 16, fontFamily: 'Poppins-SemiBold', color: THEME.textPrimary, marginBottom: 15, textAlign: 'center', },
    checkboxList: { width: '100%', alignItems: 'flex-start', marginBottom: 20, },
    checkboxRowWrapper: { width: '100%', marginBottom: 10, position: 'relative', }, // zIndex dinâmico
    checkboxRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', minHeight: 45, },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', flexShrink: 0, paddingRight: 10, },
    checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: THEME.textSecondary, marginRight: 12, },
    checkedCheckbox: { backgroundColor: THEME.green, borderColor: THEME.green, },
    checkboxLabel: { fontSize: 16, fontFamily: 'Poppins-Regular', color: THEME.textPrimary, flexShrink: 1 },
    inputGroupContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', minHeight: 38 },
    fieldValueInput: { flexGrow: 1, maxWidth: '60%', height: 38, borderWidth: 0, borderRadius: 8, paddingHorizontal: 10, fontSize: 15, fontFamily: 'Poppins-Regular', color: THEME.textPrimary, backgroundColor: THEME.card, marginRight: 8, },
    unitSelectorButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 38, minWidth: 65, backgroundColor: THEME.tagBackground, borderRadius: 8, paddingHorizontal: 10, },
    unitSelectorButtonText: { fontSize: 14, fontFamily: 'Poppins-Medium', color: THEME.textSecondary, marginRight: 4, },
    unitDropdownList: { position: 'absolute', top: 40, right: 0, backgroundColor: THEME.card, borderRadius: 8, borderWidth: 1, borderColor: THEME.tagBackground, paddingVertical: 5, minWidth: 65, zIndex: 1000, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 5, },
    unitDropdownItem: { paddingHorizontal: 15, paddingVertical: 12, },
    unitDropdownItemText: { fontSize: 14, fontFamily: 'Poppins-Regular', color: THEME.textPrimary, },
    sendButtonContainer: { width: '100%', alignItems: 'flex-end', marginTop: 20, marginBottom: 10, },
    sendButton: { backgroundColor: THEME.green, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, minWidth: '40%', alignSelf: 'flex-end', },
    sendButtonText: { fontSize: 16, fontFamily: 'Montserrat-Medium', color: THEME.card, textAlign: 'center', },
});