// services/userService.ts
import { db } from '../app/firebaseConfig'; // Verifique o path

export const hasCompletedOnboarding = async (uid: string): Promise<boolean> => {
    console.log(`userService: Verificando onboarding para UID: ${uid}`);
    if (!uid) {
        console.log("userService: UID não fornecido.");
        return false;
    }

    try {
        const userDocRef = db.collection('users').doc(uid);
        const userDoc = await userDocRef.get();

        if (userDoc.exists) {
            const onboardingComplete = userDoc.data()?.onboardingComplete === true;
            console.log(`userService: Documento encontrado para ${uid}. onboardingComplete: ${onboardingComplete}`);
            return onboardingComplete;
        } else {
            console.log(`userService: Documento NÃO encontrado para ${uid}. Assumindo onboarding incompleto.`);
             // Se o documento não existe, podemos assumir que o onboarding não foi completo.
             // Você pode querer criar o documento aqui ou em outro lugar se isso for um estado inesperado.
            return false;
        }
    } catch (error) {
        console.error(`userService: Erro ao verificar status de onboarding para ${uid}:`, error);
        // Em caso de erro de leitura, é mais seguro assumir que não completou,
        // mas isso pode prender o usuário se for um erro temporário.
        // Retornar null ou lançar o erro pode ser outra opção dependendo do fluxo desejado.
        return false; // Retorna false em caso de erro para evitar bloqueio, mas loga o erro.
    }
};