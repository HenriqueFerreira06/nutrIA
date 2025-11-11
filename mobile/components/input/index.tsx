import { Controller } from 'react-hook-form';
import { KeyboardTypeOptions, StyleSheet, Text, TextInput, View } from 'react-native';

interface InputProps{
    name: string;
    control: any;
    placeholder?: string;
    rules?: object;
    error?: string;
    keyboardType: KeyboardTypeOptions;
    
}

export function Input({ name, control, placeholder, rules, error, keyboardType}: InputProps) {
    return (
        <View style={styles.container}>
            <Controller 
                control={control}
                name={name}
                rules={rules}

                render={({ field: { onChange, onBlur, value}}) => (
                    <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    onBlur={onBlur}
                    value={value}
                    onChangeText={onChange}
                    keyboardType={keyboardType}
                    />
                )}
            
            />
            {error && <Text style={styles.errorText}>{error}</Text>}

        </View>
    )
}

const styles = StyleSheet.create({

    container: {
            marginBottom: 16,
    },
    input:{
        height:44,
        backgroundColor: 'white',
        paddingHorizontal: 10,
        borderRadius: 4,
    },

    errorText:{
        color: 'red',
        marginTop: 4,
    }


})