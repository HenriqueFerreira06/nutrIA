import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, TextInput, Animated, Easing } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// ### INÍCIO DA ALTERAÇÃO: Controle de velocidade da animação ###
// Altere este valor para controlar a velocidade (em milissegundos). Menor = mais rápido.
const ANIMATION_DURATION = 1000;
// ### FIM DA ALTERAÇÃO ###

// Tipos
type Produto = {
  id: string;
  code: string;
  nome: string;
  imagem: string;
  quantidade: number;
};

export default function LeitorScreen(): React.JSX.Element {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');
  const router = useRouter();

  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const requestCameraPermission = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    requestCameraPermission();

    // ### INÍCIO DA ALTERAÇÃO: Animação em loop "ping-pong" ###
    const runAnimation = () => {
      scanLineAnim.setValue(0); // Reinicia a animação
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: ANIMATION_DURATION,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: ANIMATION_DURATION,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    runAnimation();
    // ### FIM DA ALTERAÇÃO ###

  }, []);

  const processBarcode = async (code: string): Promise<void> => {
    if (!code || processing) return;
    setProcessing(true);

    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const json: any = await res.json();

      if (json.status === 0 || !json.product) {
        Alert.alert(
          "Produto não identificado",
          "O código de barras não foi encontrado em nossa base de dados.",
          [{ text: "OK", onPress: () => setProcessing(false) }]
        );
        return;
      }

      const p = json.product;
      const novoProduto: Produto = {
        id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        code: code,
        nome: p.product_name,
        imagem: p.image_front_url || p.image_front_small_url || 'https://via.placeholder.com/80',
        quantidade: 1,
      };

      if (router.canGoBack()) {
        router.back();
        setTimeout(() => {
          router.setParams({ novoProduto: JSON.stringify(novoProduto) });
        }, 100);
      }
      
    } catch (e) {
      console.error("Falha ao buscar produto:", e);
      Alert.alert("Erro", "Ocorreu um erro ao buscar o produto.", [{ text: "OK", onPress: () => setProcessing(false) }]);
    }
  };

  if (hasPermission === null) {
    // ### ALTERAÇÃO FEITA ###
    // Mensagem de "solicitando" removida.
    // Isso exibirá apenas uma tela preta (do styles.center) enquanto a permissão é verificada.
    return <View style={styles.center} />;
  }
  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.center}>
        {/* O estilo 'helperText' aqui está correto. */}
        <Text style={styles.helperText}>Permissão negada para usar a câmera.</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={{color: '#fff', fontFamily: 'Montserrat-Medium'}}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const animatedLineStyle = {
    top: scanLineAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['5.5%', '92.5%'],
    }),
  };

  return (
    <SafeAreaView style={styles.flex}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={processing ? undefined : ({ data }) => processBarcode(data)}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8'],
        }}
      />
      
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <View style={styles.pointingTextContainer}>
        <Text style={styles.pointingText}>Aponte a câmera para o código de barras</Text>
      </View>

      <View pointerEvents="none" style={styles.overlay}>
        <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeftCorner]} />
            <View style={[styles.corner, styles.topRightCorner]} />
            <View style={[styles.corner, styles.bottomLeftCorner]} />
            <View style={[styles.corner, styles.bottomRightCorner]} />
            
            <Animated.View style={[styles.scanTrail, animatedLineStyle]}>
              <LinearGradient
                  colors={['rgba(255, 255, 255, 0.0)', 'rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.0)']}
                  style={{ flex: 1 }}
              />
            </Animated.View>
        </View>
      </View>

      <View style={styles.manualInputWrapper}>
        <TextInput
          style={styles.textInput}
          placeholder="Ou digite o código de barras"
          placeholderTextColor="#ffffffff"
          keyboardType="numeric"
          value={manualCode}
          onChangeText={setManualCode}
          onSubmitEditing={() => processBarcode(manualCode)}
        />
        <TouchableOpacity style={styles.manualAddButton} onPress={() => processBarcode(manualCode)}>
            <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  
  // O estilo 'helperText' está correto conforme seus comentários
  helperText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
    padding: 20,
  },

  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pointingTextContainer: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    zIndex: 6,
    backgroundColor: 'rgba(27, 12, 69, 0.36)',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  pointingText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 280,
    height: 180,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#fff',
    zIndex: 1,
  },
  topLeftCorner: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 16,
  },
  topRightCorner: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 16,
  },
  bottomLeftCorner: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 16,
  },
  bottomRightCorner: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 16,
  },
  scanTrail: {
    position: 'absolute',
    left: 0,
    width: '100%',
    height: 80,
    transform: [{ translateY: -40 }], 
  },
  closeBtn: {
    marginTop: 16,
    backgroundColor: 'rgba(12, 69, 37, 0.36)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  manualInputWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    paddingBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 5,
  },
  textInput: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(27, 12, 69, 0.36)', 
    marginRight: 10,
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#fff', // Cor do texto digitado
  },
  manualAddButton: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(12, 69, 22, 0.36)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
});