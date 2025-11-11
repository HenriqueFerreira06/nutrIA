import { DataProps } from "../controllers/CreateNutritionController";
import { GoogleGenerativeAI } from '@google/generative-ai';


interface SingleDayDataProps extends DataProps {
    diaDaSemana: string;
    indiceAlternativa: number;
}

class GenerateSingleDayPlanService {
    async execute(data: SingleDayDataProps) {
        try {
            const genAI = new GoogleGenerativeAI(process.env.API_KEY!);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            
            const prompt = `
                Você é um assistente de nutrição avançado. Sua tarefa é criar um ÚNICO plano alimentar diário em formato JSON puro, baseado nos dados do usuário para um dia e alternativa específicos.

                **Dados do Usuário:**
                - Idade: ${data.age}, Sexo: ${data.gender}
                - Altura: ${data.height} cm, Peso Atual: ${data.weight} kg, Meta de Peso: ${data.metaPeso} kg
                - Objetivo: ${data.objective}, Nível de Atividade: ${data.level}
                - Modelo de Dieta: ${data.modeloDieta}
                - Estilo de Dieta (Preferência): ${data.estiloDieta}
                - Orçamento: ${data.orcamento}
                - Restrições: ${data.restricoes}
                - Condições Médicas: ${data.condicaoMedica}
                - Medicamentos: ${data.medicamentos}

                **Tarefa Específica:**
                - Gere o plano para o dia: ${data.diaDaSemana}
                - Esta é a Alternativa: ${data.indiceAlternativa}
                - ${data.indiceAlternativa > 1 ? "Crie variações de alimentos diferentes da Alternativa 1, mantendo as metas nutricionais." : "Este é o plano principal."}

                **Instruções OBRIGATÓRIAS para o JSON:**
                1.  Retorne APENAS o objeto JSON do plano diário, NADA MAIS, sem markdown (\`\`\`).
                2.  Use a seguinte estrutura EXATA:
                    {
                      "resumo": {
                        "caloriasTotais": 2000, // Calcule um valor realista
                        "proteinasTotais": 150, // Calcule um valor realista
                        "carboidratosTotais": 200, // Calcule um valor realista
                        "lipidiosTotais": 50, // Calcule um valor realista
                        "metaAgua": 2500,
                        
                        "objetivoPrincipal": "${data.objective}"
                      },
                      "refeicoes": [
                        {
                          "id": "${data.diaDaSemana.substring(0, 3)}-${data.indiceAlternativa}-1", // ex: "Seg-1-1"
                          "nome": "Café da Manhã",
                          "horario": "08:00",
                          "categoria": "Café da Manhã",
                          "calorias": 350,
                          "proteinas": 20,
                          "carboidratos": 40,
                          "lipidios": 15,
                          "ingredientes": [{"texto": "Ovo mexido (2 unidades)"}, {"texto": "Pão integral (1 fatia)"}],
                          "tempoPreparo": "10-15 minutos",
                          "modoPreparo": ["Bata os ovos.", "Cozinhe em fogo baixo."],
                          "completed": false
                        }
                        // ... inclua as outras refeições do dia (Almoço, Lanche, Jantar)
                      ]
                    }
            `;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const jsonText = response.text();

            if (!jsonText) { throw new Error("A IA retornou uma resposta vazia."); }

            let jsonString = jsonText.replace(/```json\n/g, '').replace(/\n```/g, '').trim();
            let jsonObject = JSON.parse(jsonString);
            
            return { data: jsonObject }; 

        } catch (err) {
            console.error(`ERRO AO GERAR DIETA (Dia: ${data.diaDaSemana}, Alt: ${data.indiceAlternativa}):`, err);
            if (err instanceof Error) {
                throw new Error(`Falha na IA: ${err.message}`);
            }
            throw new Error("Falha ao se comunicar com a IA do Google.");
        }
    }
}

export { GenerateSingleDayPlanService };