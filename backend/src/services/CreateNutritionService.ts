import { DataProps } from "../controllers/CreateNutritionController";
import { GoogleGenerativeAI } from '@google/generative-ai';

class CreateNutritionService {
    async execute(data: DataProps) {
        try {
            const genAI = new GoogleGenerativeAI(process.env.API_KEY!);
            
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const prompt = `
                Você é um assistente de nutrição avançado. Sua tarefa é criar um plano alimentar SEMANAL (7 dias) em formato JSON puro, baseado nos dados do usuário.

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

                **Instruções OBRIGATÓRIAS para o JSON:**
                1.  Retorne APENAS o objeto JSON, sem markdown (\`\`\`).
                2.  O objeto JSON deve ter uma chave principal "planoSemanal".
                3.  "planoSemanal" deve ser um ARRAY contendo 7 objetos, um para cada dia da semana (na ordem: Segunda-feira, Terça-feira, Quarta-feira, Quinta-feira, Sexta-feira, Sábado, Domingo).
                4.  Cada objeto do dia deve ter a seguinte estrutura:
                    {
                      "dia": "Nome do Dia (ex: Segunda-feira)",
                      "planoCompleto": {
                      "resumo": {
                          "caloriasTotais": 2000, // Calcule um valor realista e diário
                          "proteinasTotais": 150, // Calcule um valor realista e diário
                          "carboidratosTotais": 200, // Calcule um valor realista e diário
                          "lipidiosTotais": 50, // Calcule um valor realista e diário
                          "metaAgua": 2500, // Pode ser fixo ou baseado no peso
                        
                          "objetivoPrincipal": "${data.objective}"
                      },
                      "refeicoes": [
                        {
                            "id": "dia-1", // ex: "seg-1"
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
                          },
                          {
                            "id": "dia-2", // ex: "seg-2"
                            "nome": "Almoço",
                            "horario": "12:30",
                            // ... preencha todos os campos
                            "completed": false
                          }
                          // ... incluir todas as refeições do dia
                        ]
                      }
                    }
                5.  Varie as refeições ao longo dos 7 dias para evitar monotonia, respeitando as restrições e preferências do usuário.
                6.  Certifique-se de que os campos "id" de cada refeição sejam únicos dentro de cada dia (ex: "seg-1", "seg-2", "ter-1", etc.).

                **Exemplo da Estrutura de Resposta (Incompleto):**
                {
                  "planoSemanal": [
                    {
                      "dia": "Segunda-feira",
                      "planoCompleto": {
                        "resumo": {
                          "caloriasTotais": 2100,
                          // ...
                        },
                        "refeicoes": [
                          {
                            "id": "seg-1",
                            "nome": "Café da Manhã",
                            // ...
                            "completed": false
                          }
                        ]
                      }
                    },
                    {
                      "dia": "Terça-feira",
                      // ...
                    }
                    // ... mais 5 dias
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
            console.error("ERRO AO GERAR DIETA:", err);
            throw new Error("Falha ao se comunicar com a IA do Google.");
        }
    }
}

export { CreateNutritionService };