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
    LayoutAnimation,
    UIManager,
    Platform,
    ViewStyle, // Importado para tipagem de estilo
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const THEME = {
    activeGreen: '#90C256',
    background: '#FFFFFF',
    textPrimary: '#222222',
    textSecondary: '#666666',
    cardBackground: '#FFFFFF',
    borderColor: '#F0F0F0',
    sliderMinTrack: '#90C256',
    sliderMaxTrack: '#E0E0E0',
    arrowColor: '#4F4F4F',
    headerText: '#FFFFFF',
};

// ===== CORREÇÃO: Tipagem para as props do PreferenceCard =====
interface PreferenceCardProps {
    children: React.ReactNode;
    style?: ViewStyle; // A interrogação '?' torna a prop opcional
}

// ===== COMPONENTE DO CARD DE PREFERÊNCIA COM TIPAGEM =====
const PreferenceCard: React.FC<PreferenceCardProps> = ({ children, style }) => (
    <View style={[styles.card, style]}>{children}</View>
);

// ===== COMPONENTE PRINCIPAL =====
export default function PreferenciasScreen() {
    const router = useRouter();

    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isHighContrast, setIsHighContrast] = useState(true);
    const [fontSize, setFontSize] = useState(16);
    const [areSoundsOn, setAreSoundsOn] = useState(true);
    const [isVibrationOn, setIsVibrationOn] = useState(true);
    const [isLanguagePickerOpen, setIsLanguagePickerOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('Português (BR)');

    const languages = ['Português (BR)', 'Inglês (EUA)', 'Espanhol'];

    const toggleLanguagePicker = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsLanguagePickerOpen(!isLanguagePickerOpen);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.headerContainer}>
                <Image
                    source={require('../../assets/images/grupoverde.png')}
                    style={styles.backgroundImage}
                />
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <MaterialIcons name="arrow-back" size={24} color={THEME.headerText} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Preferências</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}>
                
                {/* Modo Escuro */}
                <PreferenceCard>
                    <Text style={styles.cardText}>Modo escuro</Text>
                    <Switch
                        trackColor={{ false: THEME.sliderMaxTrack, true: THEME.activeGreen }}
                        thumbColor={THEME.background}
                        onValueChange={setIsDarkMode}
                        value={isDarkMode}
                    />
                </PreferenceCard>

                {/* Modo Alto Contraste */}
                <PreferenceCard>
                    <Text style={styles.cardText}>Modo alto contraste</Text>
                    <Switch
                        trackColor={{ false: THEME.sliderMaxTrack, true: THEME.activeGreen }}
                        thumbColor={THEME.background}
                        onValueChange={setIsHighContrast}
                        value={isHighContrast}
                    />
                </PreferenceCard>

                {/* Tamanho da Fonte */}
                <PreferenceCard>
                    <Text style={styles.cardText}>Tamanho da fonte</Text>
                    <Slider
                        style={{ width: 150, height: 40 }}
                        minimumValue={12}
                        maximumValue={24}
                        step={1}
                        value={fontSize}
                        onValueChange={setFontSize}
                        minimumTrackTintColor={THEME.sliderMinTrack}
                        maximumTrackTintColor={THEME.sliderMaxTrack}
                        thumbTintColor={THEME.activeGreen}
                    />
                </PreferenceCard>

                {/* Sons */}
                <PreferenceCard>
                    <Text style={styles.cardText}>Sons</Text>
                    <Switch
                        trackColor={{ false: THEME.sliderMaxTrack, true: THEME.activeGreen }}
                        thumbColor={THEME.background}
                        onValueChange={setAreSoundsOn}
                        value={areSoundsOn}
                    />
                </PreferenceCard>

                {/* Vibração */}
                <PreferenceCard>
                    <Text style={styles.cardText}>Vibração</Text>
                    <Switch
                        trackColor={{ false: THEME.sliderMaxTrack, true: THEME.activeGreen }}
                        thumbColor={THEME.background}
                        onValueChange={setIsVibrationOn}
                        value={isVibrationOn}
                    />
                </PreferenceCard>

                {/* Idiomas */}
                <View>
                    <TouchableOpacity onPress={toggleLanguagePicker}>
                        <PreferenceCard>
                            <Text style={styles.cardText}>Idiomas</Text>
                            <MaterialIcons
                                name={isLanguagePickerOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                                size={24}
                                color={THEME.arrowColor}
                            />
                        </PreferenceCard>
                    </TouchableOpacity>

                    {isLanguagePickerOpen && (
                        <View style={styles.languagePickerContainer}>
                            {languages.map((lang, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.languageOption}
                                    onPress={() => {
                                      setSelectedLanguage(lang);
                                        toggleLanguagePicker();
                                    }}>
                                    <Text style={[styles.languageText, selectedLanguage === lang && styles.selectedLanguageText]}>
                                        {lang}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: THEME.background, 
    },
    headerContainer: {
        height: 180, 
        justifyContent: 'center',
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        resizeMode: 'cover',
        top: -50,
        left: -25,
        height: 300,
        width: 500,
        transform: [{ scaleY: -1 }],
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 30, 
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: THEME.headerText,
        marginLeft: 30,
    },
    scrollView: {
        flex: 1,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        marginTop: -40, 
    },
    scrollViewContent: {
        padding: 20,
    },
    card: {
        backgroundColor: THEME.cardBackground,
        borderRadius: 15,
        paddingVertical: 10,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 3,
    },
    cardText: {
        fontSize: 16,
        fontWeight: '500',
        color: THEME.textPrimary,
    },
    languagePickerContainer: {
        backgroundColor: THEME.cardBackground,
        borderRadius: 15,
        marginTop: -10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 3,
    },
    languageOption: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: THEME.borderColor,
    },
    languageText: {
        fontSize: 16,
        color: THEME.textSecondary,
    },
    selectedLanguageText: {
        color: THEME.activeGreen,
        fontWeight: 'bold',
    },
});