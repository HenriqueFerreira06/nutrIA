import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity, TextInput, Image, Modal, Platform,  Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { auth, db } from '../firebaseConfig';
import type firebase from 'firebase/compat/app'; 

const THEME = {
  purpleDark: '#1F004D',
  idBackground: '#BDBCC53D',
  white: '#ffffff',
  textGray: '#888888',
  textBlack: '#333333',
  greenStar: '#28A745',
  borderGray: '#E0E0E0',
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
        }
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
    if (!nome) {
      Alert.alert("Atenção", "O nome é obrigatório.");
      return;
    }

    setSaving(true);
    try {
      const userDocRef = db.collection("users").doc(user.uid);

      await userDocRef.set({
        nome: nome,
        sobrenome: sobrenome,
        dataNascimento: dataNascimento,
        sexo: sexo,
        peso: peso,
        altura: altura,
        idade: idade,
      }, { merge: true }); 

      Alert.alert("Sucesso", "Perfil atualizado!");
      router.back();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar o perfil.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyID = () => {
    if (user?.uid) {
      Alert.alert("ID Copiado!", user.uid);
    }
  };
  
  const handleSelectGender = (selectedGender: string) => {
    setSexo(selectedGender);
    setGenderModalVisible(false);
  };
  
  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);

    if (event.type === 'set') {
      let tempDate = new Date(currentDate);
      let fDate = tempDate.getDate().toString().padStart(2, '0') + '/' + (tempDate.getMonth() + 1).toString().padStart(2, '0') + '/' + tempDate.getFullYear();
      setDataNascimento(fDate);
    }
  };

  const GENDER_OPTIONS = ['Feminino', 'Masculino', 'Outro', 'Prefiro não informar'];

  if (loading) {
      return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={THEME.purpleDark}/></View>
  }

  return (
    <SafeAreaView style={styles.safeArea}>
                        <Image
                            source={require('../../assets/images/grupoverde.png')}
                            style={styles.backgroundImage}
                        />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={THEME.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plano alimentar</Text>
        </View>
      <ScrollView contentContainerStyle={styles.contentContainer}>




        <View style={styles.inputSection}>
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Objetivo<Text style={styles.requiredStar}>*</Text></Text>
            <TextInput style={styles.textInput} value={nome} onChangeText={setNome} />
          </View>
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Meta de peso (kg)</Text>
            <TextInput style={styles.textInput} value={sobrenome} onChangeText={setSobrenome} />
          </View>
          <TouchableOpacity style={styles.inputCard} onPress={() => setGenderModalVisible(true)}>
            <Text style={styles.inputLabel}>Frequencia de atividade fisica <Text style={styles.requiredStar}>*</Text></Text>
            <Text style={styles.textInput}>{sexo || 'Não informado'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputCard} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.inputLabel}>Modelo de dieta</Text>
            <Text style={styles.textInput}>{dataNascimento || 'Não informado'}</Text>
          </TouchableOpacity>
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Investiemento financeiro mensal<Text style={styles.requiredStar}>*</Text></Text>
            <TextInput style={styles.textInput} value={idade} onChangeText={setIdade} keyboardType="numeric" />
          </View>
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Condição(ões) médica(s)</Text>
            <TextInput style={styles.textInput} value={peso} onChangeText={setPeso} keyboardType="numeric" />
          </View>
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Medicamentos(cm)</Text>
            <TextInput style={styles.textInput} value={altura} onChangeText={setAltura} keyboardType="numeric" />
          </View>
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Alergia/seletividade/preferência a alimentos</Text>
            <TextInput style={styles.textInput} value={altura} onChangeText={setAltura} keyboardType="numeric" />
          </View>
        </View>
        <Text style={styles.requiredMessage}>
          <Text style={styles.requiredStar}>*</Text> indica um campo obrigatório
        </Text>

                <TouchableOpacity style={styles.editInfoButton}>
                  <Text style={styles.editInfoButtonText}>Editar informações</Text>
                </TouchableOpacity>

      </ScrollView>

      <Modal
        transparent={true}
        visible={isGenderModalVisible}
        animationType="fade"
        onRequestClose={() => setGenderModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setGenderModalVisible(false)}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Selecione o sexo</Text>
            {GENDER_OPTIONS.map((option) => (
              <TouchableOpacity key={option} style={styles.optionButton} onPress={() => handleSelectGender(option)}>
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={'date'}
          is24Hour={true}
          display="default"
          onChange={onChangeDate}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.white },
      backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        resizeMode: 'cover',
        top: -50,
        left: -25,
        height: 300,
        width: 500,
        transform: [{ scaleY: -1 }],
    },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentContainer: { alignItems: 'center', paddingBottom: 40, paddingTop: Platform.OS === 'android' ? 40 : 0, },
header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  paddingHorizontal: 20,
  paddingTop: Platform.OS === 'android' ? 40 : 60,
  paddingBottom: 20,
  backgroundColor: 'transparent',
  position: 'relative',
},
backButton: {
  position: 'absolute',
  left: 30,
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',

},
headerTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: THEME.white,
  textAlign: 'center',
},
  profileImageContainer: { marginBottom: 30, position: 'relative' },
  profileImage: { width: 120, height: 120, borderRadius: 60, backgroundColor: THEME.borderGray },
  editImageIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: THEME.purpleDark, borderRadius: 20, padding: 8, borderWidth: 2, borderColor: THEME.white },
  idSection: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '90%',
    marginBottom: 30,
  },
  idDisplay: {
    backgroundColor: THEME.idBackground,
    borderRadius: 8,
    paddingHorizontal: 15,
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  idLabel: { fontSize: 12, color: THEME.textGray, marginBottom: 2 },
  idValueContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  idValue: { fontSize: 16, fontWeight: 'bold', color: THEME.textBlack, flex: 1, },
  copyIcon: { padding: 5 },
  editInfoButton: {
    backgroundColor: THEME.purpleDark,
    borderRadius: 50,
    paddingVertical: 20,
    paddingHorizontal: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  editInfoButtonText: { color: THEME.white, fontSize: 14, fontWeight: 'bold' },
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
  inputLabel: { fontSize: 12, color: THEME.textGray, marginBottom: 2 },
  textInput: { fontSize: 16, color: THEME.textBlack, fontWeight: '500', padding: 0 },
  requiredStar: { color: THEME.greenStar },
  requiredMessage: { width: '90%', fontSize: 12, color: THEME.textGray, textAlign: 'left' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: THEME.white,
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textBlack,
    marginBottom: 20,
  },
  optionButton: {
    width: '100%',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderGray,
  },
  optionText: {
    fontSize: 16,
    color: THEME.textBlack,
    textAlign: 'center',
  },
});