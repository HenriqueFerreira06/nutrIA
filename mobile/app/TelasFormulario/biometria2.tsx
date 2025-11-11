import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    Pressable,
    SafeAreaView,
    Image,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useDataStore } from '../../store/data';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const { width } = Dimensions.get('window');

const schema = z.object({
    
    age: z.string().min(1, "A idade é obrigatória."),
    gender: z.string().min(1, "Por favor, selecione seu sexo."),
    height: z.string().min(2, "A altura é obrigatória."),
    weight: z.string().min(2, "O peso é obrigatório."),
    metaPeso: z.string().min(2, "A meta de peso é obrigatória."),
}).refine(data => {
    const heightInCm = parseFloat(data.height);
    const goalWeight = parseFloat(data.metaPeso);
    if (isNaN(heightInCm) || heightInCm <= 0 || isNaN(goalWeight)) return true;
    const heightInMeters = heightInCm / 100;
    const bmi = goalWeight / (heightInMeters * heightInMeters);
    return bmi > 18;
}, {
    message: "A meta de peso desejada é muito baixa para o seu corpo, isso pode causar danos a sua saúde. Por favor, escolha uma meta realista.",
    path: ["metaPeso"],
});

type FormData = z.infer<typeof schema>;

const FormInput = ({ control, name, label, placeholder, unit, keyboardType = 'default', errors }: any) => (
    <>
        <Text style={styles.label}>{label}</Text>
        <Controller
            control={control}
            name={name}
            render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputContainer, errors[name] && styles.inputError]}>
                    <TextInput 
                        style={styles.input} 
                        placeholder={placeholder} 
                        placeholderTextColor="#9CA3AF"
                        onBlur={onBlur} 
                        onChangeText={onChange} 
                        value={value} 
                        keyboardType={keyboardType as any}
                    />
                    {unit && <Text style={styles.inputUnit}>{unit}</Text>}
                </View>
            )}
        />
        {errors[name] && <Text style={styles.errorText}>{errors[name].message}</Text>}
    </>
);

export default function BiometriaScreen() {
    const { user, updateUser } = useDataStore();

    const { control, handleSubmit, formState: { errors, isValid } } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        // Lógica de valores padrão ATIVADA
        defaultValues: {
            
            age: user.age || '',
            gender: user.gender || '',
            height: user.height || '',
            weight: user.weight || '',
            metaPeso: user.metaPeso || '',
        }
    });

    const handleNext = (data: FormData) => {
        updateUser(data); 
        console.log("Dados de biometria salvos:", data);
        router.push('/TelasFormulario/atividadeFisica3');
    };

    const handleGoBack = () => router.back();

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <View style={styles.outerContainer}>
                    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                        <Pressable onPress={handleGoBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={28} color="#120D37" />
                        </Pressable>

                        <Text style={styles.title}>
                            Indique algumas {'\n'}informações sobre você
                        </Text>
                    
                        
                        <FormInput control={control} name="age" label="Qual a sua idade?" placeholder="Digite sua idade" keyboardType="numeric" errors={errors} />
                        
                        <Text style={styles.label}>Qual o seu sexo?</Text>
                        <Controller
                            control={control}
                            name="gender"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.genderContainer}>
                                    <Pressable onPress={() => onChange('Masculino')} style={[styles.genderOption, value === 'Masculino' && styles.genderSelected]}>
                                        <Image source={require('../../assets/images/male.png')} style={styles.genderImage} />
                                        <Text style={styles.genderText}>Masculino</Text>
                                    </Pressable>
                                    <Pressable onPress={() => onChange('Feminino')} style={[styles.genderOption, value === 'Feminino' && styles.genderSelected]}>
                                        <Image source={require('../../assets/images/female.png')} style={styles.genderImage} />
                                        <Text style={styles.genderText}>Feminino</Text>
                                    </Pressable>
                                </View>
                            )}
                        />
                        {errors.gender && <Text style={styles.errorText}>{errors.gender.message}</Text>}

                        <FormInput control={control} name="height" label="Qual a sua altura?" placeholder="Digite aqui" unit="cm" keyboardType="numeric" errors={errors} />
                        <FormInput control={control} name="weight" label="Qual o seu peso atual?" placeholder="Digite aqui" unit="kg" keyboardType="numeric" errors={errors} />
                        <FormInput control={control} name="metaPeso" label="Qual a sua meta de peso?" placeholder="Digite aqui" unit="kg" keyboardType="numeric" errors={errors} />
                    </ScrollView>
                    
                    <Pressable
                        onPress={handleSubmit(handleNext)}
                        disabled={!isValid}
                        style={[styles.nextButton, !isValid && styles.buttonDisabled]}
                    >
                        <Text style={styles.nextButtonText}>Próximo</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    outerContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
        justifyContent: 'space-between',
    },
    scrollContainer: {
        paddingBottom: 40,
    },
    backButton: {
        marginBottom: 24,
        alignSelf: 'flex-start',
    },
    title: {
        fontSize: width * 0.08,
        fontFamily: 'Montserrat-Bold',
        color: '#120D37',
        marginBottom: 32,
        lineHeight: width * 0.1,
    },
    label: {
        fontSize: width * 0.042,
        fontFamily: 'Montserrat-SemiBold',
        color: '#374151',
        marginTop: 24,
        marginBottom: 12,
    },
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    genderOption: {
        flex: 1,
        height: width * 0.42,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    genderSelected: {
        borderColor: '#44BC7F',
        backgroundColor: '#F0FAF5',
    },
    genderImage: {
        width: '50%',
        height: '50%',
        resizeMode: 'contain',
    },
    genderText: {
        fontSize: width * 0.04,
        fontFamily: 'Montserrat-SemiBold',
        color: '#374151',
        marginTop: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 20,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        height: 60,
    },
    inputError: {
        borderColor: '#EF4444',
    },
    input: {
        flex: 1,
        fontSize: width * 0.04,
        fontFamily: 'Montserrat-Regular',
        color: '#120D37',
    },
    inputUnit: {
        fontSize: width * 0.04,
        fontFamily: 'Montserrat-Regular',
        color: '#9CA3AF',
    },
    nextButton: {
        width: '100%',
        backgroundColor: '#1B0C45',
        paddingVertical: 18,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
    buttonDisabled: {
        backgroundColor: 'rgba(27, 12, 69, 0.5)',
    },
    nextButtonText: {
        fontSize: width * 0.045,
        fontFamily: 'Montserrat-Bold',
        color: '#FFFFFF'
    },
    errorText: {
        color: '#EF4444',
        fontFamily: 'Montserrat-Regular',
        marginTop: 8,
        marginLeft: 4,
        fontSize: width * 0.035,
    }
});