import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export default function Index() {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#408B4B" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
});