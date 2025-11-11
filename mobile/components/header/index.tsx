import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Platform, Pressable, SafeAreaView, StatusBar, StyleSheet, View } from "react-native";



export function Header(){
    return(
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View>
                    <Pressable onPress={ () => router.back()}>
                        <Feather name="arrow-left" size={24} color="#000"/>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
container:{

    marginBottom: 14,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 34 : 34
},

content:{
    paddingLeft:16,
    paddingRight:16,
    paddingBottom: 34
}

})