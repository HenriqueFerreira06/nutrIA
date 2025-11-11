import React from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    TouchableOpacity, 
    SafeAreaView,
    Dimensions,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons'; 
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const THEME = {
    background: '#F8F9FA',
    headerBackground: '#8BC34A',
    headerText: '#FFFFFF',
    cardBackground: '#FFFFFF',
    textPrimary: '#1E1B3A',
    textDestructive: '#E53935',
    iconColor: '#9CA3AF',
};

type PrivacyOption = {
    id: number;
    label: string;
    isDestructive: boolean;
};

const options: PrivacyOption[] = [
    { id: 1, label: 'Trocar a senha', isDestructive: false },
    { id: 2, label: 'Trocar e-mail', isDestructive: false },
    { id: 3, label: 'Sair da conta', isDestructive: false },
    { id: 4, label: 'Excluir conta', isDestructive: true },
];

const PrivacidadeScreen: React.FC = () => {
    // CORREÇÃO: O hook useRouter deve ser chamado dentro do componente
    const router = useRouter();

    return (
        <SafeAreaView style={styles.screenContainer}>
            <View style={styles.headerContainer}>
                <Image
                    source={require('../../assets/images/grupoverde.png')}
                    style={styles.backgroundImage}
                />
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <MaterialIcons name="arrow-back" size={24} color={THEME.headerText} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Privacidade</Text>
                </View>
            </View>

            <View style={styles.optionsContainer}>
                {options.map((option) => (
                    <TouchableOpacity key={option.id} style={styles.optionButton}>
                        <Text style={[
                            styles.optionLabel, 
                            option.isDestructive && styles.deleteLabel
                        ]}>
                            {option.label}
                        </Text>
                        <Feather name="chevron-right" size={24} color={THEME.iconColor} />
                    </TouchableOpacity>
                ))}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: THEME.background,
    },
headerContainer: {
        height: 120, 
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
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: THEME.headerText,
        marginLeft: 15,
    },
    optionsContainer: {
        backgroundColor: THEME.background,
        padding: 20,
        marginTop: -40, // Puxa a lista para cima, sobrepondo a curva do header
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        flex: 1, // Faz com que o container ocupe o resto da tela
    },
    optionButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: THEME.cardBackground,
        borderRadius: 16,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 4,
    },
    optionLabel: {
        fontSize: width * 0.042,
        fontFamily: 'Montserrat-SemiBold',
        color: THEME.textPrimary,
    },
    deleteLabel: {
        color: THEME.textDestructive,
        fontFamily: 'Montserrat-Bold',
    },
});

export default PrivacidadeScreen;