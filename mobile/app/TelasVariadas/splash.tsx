import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Animated, {
    Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming,
} from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext'; // <--- Importante: verifique se o caminho está certo

const { width, height } = Dimensions.get('window');

const BACKGROUND_COLOR = '#408B4B';
const ANIMATION_DURATION = 1200;
const CIRCLE_CONFIG = [
    { top: height * 0.10, left: width * -0.10, size: width * 0.75, delay: 0 },
    { top: height * 0.425, right: width * -0.05, size: width * 0.45, delay: 100 },
    { bottom: height * 0.105, left: width * -0.15, size: width * 0.80, delay: 200 },
    { bottom: height * -0.075, right: width * -0.125, size: width * 0.725, delay: 300 },
];

const AnimatedCircle = ({ size, position, delay }: any) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0);

    useEffect(() => {
        scale.value = withRepeat(withTiming(1.05, { duration: 4000, easing: Easing.inOut(Easing.ease) }), -1, true);
        opacity.value = withDelay(delay, withTiming(1, { duration: ANIMATION_DURATION }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.Image
            source={require('@/assets/images/ellipse3.png')}
            style={[styles.circle, { width: size, height: size, ...position }, animatedStyle]}
            resizeMode="contain"
        />
    );
};


export default function SplashScreen() {
    const logoScale = useSharedValue(0.8);
    const logoOpacity = useSharedValue(0);
    const [showPanicButton, setShowPanicButton] = useState(false);
    
    // Tenta obter a função do contexto. Se não existir, não quebra o app.
    const auth = useAuth() as any;
    const forceUpdate = auth?.forceUpdateOnboardingStatus;

    useEffect(() => {
        logoScale.value = withTiming(1, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.exp) });
        logoOpacity.value = withTiming(1, { duration: ANIMATION_DURATION });

        // === CRONÓMETRO DE EMERGÊNCIA ===
        // Se após 12 segundos ainda estivermos aqui, mostra o botão.
        const timer = setTimeout(() => {
            setShowPanicButton(true);
        }, 12000);

        return () => clearTimeout(timer);
    }, []);

    const animatedLogoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
        opacity: logoOpacity.value,
    }));

    const handlePanic = () => {
        if (forceUpdate) {
             // Força o status para 'false' (incompleto), o que geralmente redireciona para uma tela segura
             forceUpdate(false);
        } else {
             alert("Por favor, feche e abra o aplicativo novamente.");
        }
    };

    return (
        <View style={styles.container}>
            {CIRCLE_CONFIG.map((config, index) => (
                <AnimatedCircle
                    key={index}
                    size={config.size}
                    position={{ top: config.top, bottom: config.bottom, left: config.left, right: config.right }}
                    delay={config.delay}
                />
            ))}
            <Animated.Image
                source={require('@/assets/images/nutria.png')}
                style={[styles.logo, animatedLogoStyle]}
                resizeMode="contain"
            />

            {/* === BOTÃO DE PÂNICO === */}
            {showPanicButton && (
                <TouchableOpacity onPress={handlePanic} style={styles.panicButton}>
                    <Text style={styles.panicText}>
                        Demorando muito? Toque aqui.
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BACKGROUND_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    logo: {
        width: width * 0.65,
        height: width * 0.65,
        zIndex: 10,
    },
    circle: {
        position: 'absolute',
        opacity: 0.1,
    },
    panicButton: {
        position: 'absolute',
        bottom: 50,
        zIndex: 20,
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 30,
        elevation: 5, // Sombra no Android
    },
    panicText: {
        color: BACKGROUND_COLOR,
        fontWeight: 'bold',
        fontSize: 16,
    }
});