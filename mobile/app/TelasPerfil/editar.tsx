// app/TelasPerfil/editar.tsx (CORRIGIDO v3 - Estilos Restaurados)
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    // Image, // Mantido removido
    Modal,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { auth, db } from '../firebaseConfig'; // Verifique o caminho
import type firebase from 'firebase/compat/app';

const THEME = {
    purpleDark: '#1F004D',
    idBackground: '#BDBCC53D', // Mantido caso use em outro lugar
    white: '#ffffff',
    textGray: '#888888',
    textBlack: '#333333',
    greenStar: '#28A745',
    borderGray: '#E0E0E0',
    initialsBg: '#E0E0E0',
    headerTitleColor: '#1B0C45',
};

// --- FUNÇÃO AUXILIAR PARA INICIAIS ---
const getInitials = (firstName: string, lastName: string) => {
    const firstInitial = firstName ? firstName[0] : '';
    const lastInitial = lastName ? lastName[0] : '';
    return (firstInitial + lastInitial).toUpperCase() || '?'; // Fallback
};

export default function EditarPerfilScreen() {
    const router = useRouter();
    const [user, setUser] = useState<firebase.User | null>(auth.currentUser);

    const [nome, setNome] = useState('');
    const [sobrenome, setSobrenome] = useState('');
    const [sexo, setSexo] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [peso, setPeso] = useState('');
    const [altura, setAltura] = useState('');
    const [idade, setIdade] = useState('');

    const [isGenderModalVisible, setGenderModalVisible] = useState(false);
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setLoading(true);
            const userDocRef = db.collection('users').doc(user.uid);
            const unsubscribe = userDocRef.onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    setNome(data?.nome || '');
                    setSobrenome(data?.sobrenome || '');
                    setDataNascimento(data?.dataNascimento || '');
                    setSexo(data?.sexo || '');
                    setPeso(data?.peso || '');
                    setAltura(data?.altura || '');
                    setIdade(data?.idade || '');

                    if (data?.dataNascimento) {
                        const parts = data.dataNascimento.split('/');
                        if (parts.length === 3) {
                            const day = parseInt(parts[0], 10);
                            const month = parseInt(parts[1], 10) - 1;
                            const year = parseInt(parts[2], 10);
                            const birthDate = new Date(year, month, day);
                            if (!isNaN(birthDate.getTime())) {
                                setDate(birthDate);
                            }
                        }
                    }
                } else {
                    console.log("Documento do usuário não encontrado no Firestore.");
                }
                setLoading(false);
            }, (error) => {
                console.error("Erro ao buscar dados do usuário:", error);
                Alert.alert("Erro", "Não foi possível carregar os dados do perfil.");
                setLoading(false);
            });
            return () => unsubscribe();
        } else {
            Alert.alert("Erro de Autenticação", "Por favor, faça o login novamente.");
            router.replace('/TelasCadastroLogin/welcome');
        }
    }, [user]);

    const handleGoBack = () => router.back();

    const handleEditInfo = async () => {
        if (!user) {
            Alert.alert("Erro", "Você não está logado.");
            return;
        }
        if (!nome.trim()) {
            Alert.alert("Atenção", "O nome é obrigatório.");
            return;
        }

        setSaving(true);
        try {
            const userDocRef = db.collection("users").doc(user.uid);
            const dataToSave = {
                nome: nome.trim(),
                sobrenome: sobrenome.trim(),
                dataNascimento: dataNascimento,
                sexo: sexo,
                peso: peso,
                altura: altura,
                idade: idade,
            };
            await userDocRef.set(dataToSave, { merge: true });
            Alert.alert("Sucesso", "Perfil atualizado!");
            router.back();
        } catch (error) {
            Alert.alert("Erro", "Não foi possível atualizar o perfil. Tente novamente.");
            console.error("Erro ao salvar no Firestore:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleSelectGender = (selectedGender: string) => {
        setSexo(selectedGender);
        setGenderModalVisible(false);
    };

    const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (event.type === 'set' && selectedDate) {
            const currentDate = selectedDate;
            setDate(currentDate);
            let tempDate = new Date(currentDate);
            let fDate = tempDate.getDate().toString().padStart(2, '0') + '/' +
                        (tempDate.getMonth() + 1).toString().padStart(2, '0') + '/' +
                        tempDate.getFullYear();
            setDataNascimento(fDate);
        }
    };

    const GENDER_OPTIONS = ['Feminino', 'Masculino', 'Outro', 'Prefiro não informar'];
    const userInitials = getInitials(nome, sobrenome);

    if (loading) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={THEME.purpleDark}/></View>;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* O background verde foi removido intencionalmente na versão anterior, mantendo branco */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={THEME.headerTitleColor} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Editar perfil</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.contentContainer}>
                <View style={styles.profileImageContainer}>
                    <View style={styles.initialsContainer}>
                        <Text style={styles.initialsText}>{userInitials}</Text>
                    </View>
                </View>

                <View style={styles.inputSection}>
                    <View style={styles.inputCard}>
                        <Text style={styles.inputLabel}>Nome <Text style={styles.requiredStar}>*</Text></Text>
                        <TextInput style={styles.textInput} value={nome} onChangeText={setNome} />
                    </View>
                    <View style={styles.inputCard}>
                        <Text style={styles.inputLabel}>Sobrenome</Text>
                        <TextInput style={styles.textInput} value={sobrenome} onChangeText={setSobrenome} />
                    </View>
                    <TouchableOpacity style={styles.inputCard} onPress={() => setGenderModalVisible(true)}>
                        <Text style={styles.inputLabel}>Sexo</Text>
                        <Text style={[styles.textInput, !sexo && styles.placeholderText]}>
                            {sexo || 'Selecione'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.inputCard} onPress={() => setShowDatePicker(true)}>
                        <Text style={styles.inputLabel}>Data de nascimento</Text>
                        <Text style={[styles.textInput, !dataNascimento && styles.placeholderText]}>
                            {dataNascimento || 'Selecione'}
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.inputCard}>
                        <Text style={styles.inputLabel}>Idade</Text>
                        <TextInput style={styles.textInput} value={idade} onChangeText={setIdade} keyboardType="numeric" />
                    </View>
                    <View style={styles.inputCard}>
                        <Text style={styles.inputLabel}>Peso (kg)</Text>
                        <TextInput style={styles.textInput} value={peso} onChangeText={setPeso} keyboardType="decimal-pad" />
                    </View>
                    <View style={styles.inputCard}>
                        <Text style={styles.inputLabel}>Altura (cm)</Text>
                        <TextInput style={styles.textInput} value={altura} onChangeText={setAltura} keyboardType="numeric" />
                    </View>
                </View>

                <Text style={styles.requiredMessage}>
                    <Text style={styles.requiredStar}>*</Text> indica um campo obrigatório
                </Text>

                <TouchableOpacity style={styles.editInfoButton} onPress={handleEditInfo} disabled={saving}>
                    {saving ? (
                        <ActivityIndicator color={THEME.white} />
                    ) : (
                        <Text style={styles.editInfoButtonText}>Salvar alterações</Text>
                    )}
                </TouchableOpacity>

            </ScrollView>

            <Modal
                transparent={true}
                visible={isGenderModalVisible}
                animationType="fade"
                onRequestClose={() => setGenderModalVisible(false)}
            >
                <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setGenderModalVisible(false)}>
                    <TouchableOpacity style={styles.modalContainer} activeOpacity={1}>
                        <Text style={styles.modalTitle}>Selecione o sexo</Text>
                        {GENDER_OPTIONS.map((option) => (
                            <TouchableOpacity key={option} style={styles.optionButton} onPress={() => handleSelectGender(option)}>
                                <Text style={styles.optionText}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {showDatePicker && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={date}
                    mode={'date'}
                    display="default"
                    onChange={onChangeDate}
                    maximumDate={new Date()}
                />
            )}
        </SafeAreaView>
    );
}

// --- ESTILOS RESTAURADOS E AJUSTADOS ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: THEME.white },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.white },
    contentContainer: { alignItems: 'center', paddingBottom: 40, paddingTop: 20 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 50 : 20, // Ajustado padding superior
        paddingBottom: 20,
        backgroundColor: THEME.white,
        position: 'relative',
        borderBottomWidth: 1,
        borderBottomColor: THEME.borderGray,
    },
    backButton: {
        position: 'absolute',
        left: 20,
        top: Platform.OS === 'android' ? 50 : 20, // Alinhado com paddingTop
        bottom: 20,
        justifyContent: 'center',
        paddingRight: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'Montserrat-SemiBold', // Fonte correta
        color: THEME.headerTitleColor, // Cor correta
        textAlign: 'center',
    },
    profileImageContainer: {
        marginBottom: 30,
        position: 'relative',
        alignItems: 'center',
    },
    initialsContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: THEME.initialsBg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: THEME.purpleDark,
    },
    initialsText: {
        fontSize: 48,
        color: THEME.purpleDark,
        fontWeight: 'bold',
        fontFamily: 'Poppins-Medium', // Fonte correta
    },
    inputSection: { width: '90%' },
    inputCard: {
        backgroundColor: THEME.white,
        borderWidth: 1,
        borderColor: THEME.borderGray,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 12,
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 12,
        color: THEME.textGray,
        marginBottom: 4,
        fontFamily: 'Poppins-Medium', // Fonte correta
    },
    textInput: {
        fontSize: 16,
        color: THEME.textBlack,
        fontWeight: '500',
        paddingVertical: 4,
        fontFamily: 'Poppins-Medium', // Fonte correta
    },
    placeholderText: {
        color: THEME.textGray,
        fontFamily: 'Poppins-Medium', // Fonte correta
    },
    requiredStar: { color: THEME.greenStar },
    requiredMessage: {
        width: '90%',
        fontSize: 12,
        color: THEME.textGray,
        textAlign: 'left',
        fontFamily: 'Poppins-Medium', // Fonte correta
    },
    editInfoButton: {
        backgroundColor: THEME.purpleDark,
        borderRadius: 50,
        paddingVertical: 18,
        paddingHorizontal: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
        minHeight: 50,
    },
    editInfoButtonText: {
        color: THEME.white,
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Poppins-Medium', // Fonte correta
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: THEME.white,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 20,
        width: '85%',
        alignItems: 'stretch',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: THEME.textBlack,
        marginBottom: 15,
        textAlign: 'center',
        fontFamily: 'Poppins-Medium', // Fonte correta
    },
    optionButton: {
        width: '100%',
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: THEME.borderGray,
    },
    optionText: {
        fontSize: 16,
        color: THEME.textBlack,
        textAlign: 'center',
        fontFamily: 'Poppins-Medium', // Fonte correta
    },
});