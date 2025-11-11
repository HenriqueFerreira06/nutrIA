import { create } from 'zustand';
import { MaterialIcons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Tipo para o usuário do formulário
export type User = {
    name: string;
    age: string;
    gender: string;
    height: string;
    weight: string;
    objective: string;
    metaPeso: string; 
    level: string;
    modeloDieta: string; 
    orcamento: string; 
    medicamentos: string; 
    condicaoMedica: string; 
    estiloDieta: string; 
    restricoes: string; 
};

// Tipo para o resultado da dieta da IA
type DietData = {
    [key: string]: any; 
};

// Tipo para as refeições
export type Meal = {
  id: string;
  nome: string;
  calorias: number;
  lipidios: number;
  carboidratos: number;
  proteinas: number;
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  completed: boolean;
  categoria: string;
  icon?: string;
  ingredientes: { texto: string }[];
  tempoPreparo: string;
  modoPreparo: string[];
};

// CORREÇÃO: Adicionada a palavra 'export' para que outros arquivos possam usar este tipo.
export type DataState = {
    user: User;
    diet: DietData | null;
    meals: Meal[];
    updateUser: (data: Partial<User>) => void;
    setDiet: (diet: DietData) => void;
    setMeals: (meals: Meal[]) => void;
    toggleMealCompletion: (mealId: string) => void;
    clearUser: () => void;
};

const initialUserState: User = {
    name: "", age: "", gender: "", height: "", weight: "",
    objective: "", metaPeso: "", level: "", modeloDieta: "",
    orcamento: "", medicamentos: "", condicaoMedica: "",
    estiloDieta: "", restricoes: "",
};

export const useDataStore = create<DataState>((set) => ({
    user: initialUserState,
    diet: null,
    meals: [], 
    updateUser: (data) => set((state) => ({ 
        user: { ...state.user, ...data } 
    })),
    setDiet: (dietData) => set({ diet: dietData }),
    setMeals: (mealsData) => set({ meals: mealsData }),
    toggleMealCompletion: (mealId) => set((state) => ({
      meals: state.meals.map(meal => 
        meal.id === mealId ? { ...meal, completed: !meal.completed } : meal
      )
    })),
    clearUser: () => set({ user: initialUserState, diet: null, meals: [] }),
}));