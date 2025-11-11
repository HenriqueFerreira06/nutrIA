import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';


const THEME = {
  activeGreen: '#90C256',
  darkGreen: '#2E7D32',
  background: '#F4F7F6',
  textPrimary: '#333333',
  textSecondary: '#666666',
  white: '#FFFFFF',
  cardBlue: '#2D2A8C',
  divider: '#E0E0E0',
};

export default function AssinaturaScreen() {
  const router = useRouter();

  const [cobrancaAuto, setCobrancaAuto] = useState(true);
  const [biometria, setBiometria] = useState(false);

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={THEME.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assinatura</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.cardContainer}>
          <View style={styles.cardCircle} />
          <Text style={styles.cardBrand}>VISA</Text>
          <Text style={styles.cardName}>Henrique Ávila
            
          </Text>
          <Text style={styles.cardNumber}>xxxx - xxxx - xxxx - xxxx</Text>
        </View>


        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Dados do cartão</Text>
          <MaterialIcons name="expand-more" size={24} color={THEME.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Trocar método de pagamento</Text>
          <MaterialIcons name="expand-more" size={24} color={THEME.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Cancelar assinatura</Text>
          <MaterialIcons name="expand-more" size={24} color={THEME.textSecondary} />
        </TouchableOpacity>


        <View style={styles.switchOption}>
          <Text style={styles.optionText}>Cobrança automática</Text>
          <Switch
            trackColor={{ false: '#ccc', true: THEME.activeGreen }}
            thumbColor={THEME.white}
            value={cobrancaAuto}
            onValueChange={setCobrancaAuto}
          />
        </View>

        <View style={styles.switchOption}>
          <Text style={styles.optionText}>Biometria</Text>
          <Switch
            trackColor={{ false: '#ccc', true: THEME.activeGreen }}
            thumbColor={THEME.white}
            value={biometria}
            onValueChange={setBiometria}
          />
        </View>


        <Text style={styles.footerText}>
          Problemas com a assinatura ou segurança? Entre em contato com o suporte do aplicativo.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.activeGreen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 25,
    paddingTop: 20,
    marginTop: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.white,
    marginLeft: 12,
  },
  scrollContent: {
    padding: 20,
    backgroundColor: THEME.background,
    borderTopEndRadius: 20,
    borderTopStartRadius:20,
  },
  cardContainer: {
    backgroundColor: THEME.cardBlue,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    height: 160,
    justifyContent: 'center',
  },
  cardCircle: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardBrand: {
    color: THEME.white,
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'flex-end',
  },
  cardName: {
    color: THEME.white,
    fontSize: 16,
    marginTop: 30,
  },
  cardNumber: {
    color: THEME.white,
    fontSize: 14,
    marginTop: 5,
  },
  option: {
    backgroundColor: THEME.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: THEME.textPrimary,
  },
  switchOption: {
    backgroundColor: THEME.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    marginTop: 30,
    fontSize: 13,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
