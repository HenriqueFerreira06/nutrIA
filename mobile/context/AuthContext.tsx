import React, { createContext, useState, useContext, useEffect, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { auth } from '@/app/firebaseConfig'; // <-- Este é o OBJETO
import { hasCompletedOnboarding } from '@/services/userService';
import SplashScreen from '@/app/TelasVariadas/splash';

interface UserData {
    uid: string;
    nome: string;
    sobrenome?: string;
    email: string | null;
    iniciais?: string;
}

interface AuthContextType {
    user: UserData | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    isOnboardingComplete: boolean | null;
    login: (userData: UserData) => Promise<void>;
    logout: () => Promise<void>;
    clearLastUserAndLogout: () => Promise<void>;
    forceUpdateOnboardingStatus: (status: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);

    const getInitials = (nome?: string, sobrenome?: string): string => {
        const n = nome ? nome[0] : '';
        const s = sobrenome ? sobrenome[0] : '';
        return `${n}${s}`.toUpperCase();
    };

    const checkOnboardingStatus = async (uid: string | null) => {
        if (!uid) {
            setIsOnboardingComplete(null);
            return;
        }
        try {
            const completed = await hasCompletedOnboarding(uid);
            setIsOnboardingComplete(completed);
        } catch (error) {
            console.error("AuthProvider: checkOnboardingStatus - ERRO:", error);
            setIsOnboardingComplete(null);
        }
    };

    useEffect(() => {
        const restoreSession = async () => {
            console.log("AuthProvider: INICIANDO restoreSession...");
            let loadedUser: UserData | null = null;
            let loggedIn = false;
            try {
                const storedUserString = await AsyncStorage.getItem('@lastUser');
                const storedIsLoggedIn = await AsyncStorage.getItem('@isLoggedIn');
                console.log(`AuthProvider: Storage lido - User: ${!!storedUserString}, LoggedIn: ${storedIsLoggedIn}`);

                if (storedUserString) {
                    try {
                        const parsedData = JSON.parse(storedUserString);
                        if (parsedData && typeof parsedData === 'object' && parsedData.uid) {
                            loadedUser = parsedData as UserData;
                            loadedUser.iniciais = getInitials(loadedUser.nome, loadedUser.sobrenome);
                        } else {
                            console.error("AuthProvider: Dados inválidos no @lastUser, limpando.");
                            await AsyncStorage.removeItem('@lastUser');
                        }
                    } catch (parseError) {
                        console.error("AuthProvider: ERRO ao parsear @lastUser:", parseError);
                        await AsyncStorage.removeItem('@lastUser');
                    }
                }
                setUser(loadedUser);

                await new Promise(resolve => setTimeout(resolve, 100));

                // --- CORREÇÃO AQUI --- (removido parênteses)
                const firebaseUser = auth.currentUser;
                // ---------------------

                console.log("AuthProvider: Firebase currentUser:", firebaseUser?.uid || 'Nenhum');

                if (storedIsLoggedIn === 'true' && loadedUser && firebaseUser && firebaseUser.uid === loadedUser.uid) {
                    console.log("AuthProvider: Estado consistente. Marcando como logado.");
                    loggedIn = true;
                } else {
                    console.log("AuthProvider: Estado inconsistente ou não logado. Marcando como NÃO logado.");
                    if(firebaseUser) {
                        console.log("AuthProvider: Deslogando Firebase por segurança.");
                        
                        // --- CORREÇÃO AQUI --- (removido parênteses)
                        await auth.signOut();
                        // ---------------------
                    }
                    loggedIn = false;
                    await AsyncStorage.setItem('@isLoggedIn', 'false');
                    if ((firebaseUser && loadedUser && firebaseUser.uid !== loadedUser.uid) || (!storedUserString && loadedUser)) {
                         await AsyncStorage.removeItem('@lastUser');
                         setUser(null);
                    }
                }
                setIsLoggedIn(loggedIn);

                if (loggedIn && loadedUser) {
                    await checkOnboardingStatus(loadedUser.uid);
                } else {
                    setIsOnboardingComplete(null);
                }

            } catch (e) {
                console.error("AuthProvider: ERRO GERAL em restoreSession:", e);
                setUser(null);
                setIsLoggedIn(false);
                setIsOnboardingComplete(null);
                await AsyncStorage.multiRemove(['@lastUser', '@isLoggedIn']);
            } finally {
                console.log("AuthProvider: FINALIZANDO restoreSession. setIsLoading(false).");
                setIsLoading(false);
            }
        };
        restoreSession();
    }, []);

    useEffect(() => {
        if (!isLoading && isLoggedIn && user && isOnboardingComplete === null) {
            checkOnboardingStatus(user.uid);
        } else if (!isLoggedIn && isOnboardingComplete !== null) {
            setIsOnboardingComplete(null);
        }
    }, [isLoggedIn, user, isLoading]);


    const login = async (userData: UserData) => {
        console.log("AuthProvider: LOGIN - Iniciando com:", userData.nome);
        try {
            userData.iniciais = getInitials(userData.nome, userData.sobrenome);
            await AsyncStorage.setItem('@lastUser', JSON.stringify(userData));
            await AsyncStorage.setItem('@isLoggedIn', 'true');
            setUser(userData);
            setIsLoggedIn(true);
            setIsOnboardingComplete(null);
            console.log("AuthProvider: LOGIN - Concluído. Status de onboarding será verificado.");
        } catch (e) {
            console.error("AuthContext login error:", e);
            setUser(null);
            setIsLoggedIn(false);
            setIsOnboardingComplete(null);
        }
    };

    const logout = async () => {
        console.log("AuthProvider: LOGOUT - Iniciando...");
        try {
            // --- CORREÇÃO AQUI --- (removido parênteses)
            await auth.signOut();
            // ---------------------
            
            await AsyncStorage.setItem('@isLoggedIn', 'false');
            setIsLoggedIn(false);
            setIsOnboardingComplete(null);
            console.log("AuthProvider: LOGOUT - Concluído.");
        } catch (e) {
            console.error("AuthContext logout error:", e);
        }
    };

    const clearLastUserAndLogout = async () => {
        console.log("AuthProvider: CLEAR - Iniciando...");
        try {
            // --- CORREÇÃO AQUI --- (removido parênteses)
            await auth.signOut();
            // ---------------------

            await AsyncStorage.removeItem('@lastUser');
            await AsyncStorage.setItem('@isLoggedIn', 'false');
            setUser(null);
            setIsLoggedIn(false);
            setIsOnboardingComplete(null);
            console.log("AuthProvider: CLEAR - Concluído.");
        } catch (e) {
            console.error("AuthContext clearLastUserAndLogout error:", e);
        }
    };

    const forceUpdateOnboardingStatus = (status: boolean) => {
        console.log(`AuthProvider: Forçando isOnboardingComplete para ${status}`);
        setIsOnboardingComplete(status);
    };

    const value = {
        user,
        isLoggedIn,
        isLoading,
        isOnboardingComplete,
        login,
        logout,
        clearLastUserAndLogout,
        forceUpdateOnboardingStatus,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ================== AuthGuard Revisado ==================
export const AuthGuard: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isLoggedIn, isLoading, isOnboardingComplete } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const navigationAttempted = useRef(false);

    useEffect(() => {
        navigationAttempted.current = false;
    }, [isLoggedIn, isOnboardingComplete]);

    useEffect(() => {
        if (isLoading || (isLoggedIn && isOnboardingComplete === null)) {
            return;
        }

        if (navigationAttempted.current) {
            return;
        }

        const currentRoute = segments.join('/') || 'index';
        // @ts-ignore
        const isRoot = segments.length === 0;
        const inAuthGroup = segments[0] === '(TelasAbas)';
        const inOnboardingGroup = segments[0] === 'TelasFormulario';
        const inAuthScreensGroup = segments[0] === 'TelasCadastroLogin';
        const inAuthScreens = isRoot || inAuthScreensGroup;
        const inPostOnboardingScreens = segments[0] === 'TelasDesbloquearPlano';
        const isTermsScreen = currentRoute === 'TelasVariadas/termosUsoPriv';

        let targetRoute: string | null = null;

        if (isLoggedIn) {
            if (isOnboardingComplete === false) {
                const allowed = inOnboardingGroup || inPostOnboardingScreens || isTermsScreen;
                if (!allowed) {
                    targetRoute = '/TelasFormulario/objetivo1';
                }
            } else if (isOnboardingComplete === true) {
                if (isRoot || inAuthScreensGroup) {
                    targetRoute = '/(TelasAbas)/home';
                }
            }
        } else {
            if (!inAuthScreens) {
                targetRoute = '/TelasCadastroLogin/welcome';
            }
        }

        if (targetRoute && targetRoute !== `/${currentRoute}` && targetRoute !== currentRoute) {
            navigationAttempted.current = true;
            router.replace(targetRoute as any);
        }

    }, [isLoggedIn, isLoading, isOnboardingComplete, segments]);

    const shouldShowSplash = isLoading || (isLoggedIn && isOnboardingComplete === null);

    if (shouldShowSplash) {
        return <SplashScreen />;
    }

    return <>{children}</>;
};