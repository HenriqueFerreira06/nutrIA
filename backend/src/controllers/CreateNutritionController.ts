import { FastifyRequest, FastifyReply } from 'fastify' 
import { GenerateSingleDayPlanService } from '../services/GenerateSingDayPlanService' 


export interface DataProps {
  
  
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
}


interface SingleDayRequestProps extends DataProps {
  diaDaSemana: string;
  indiceAlternativa: number;
}


class CreateNutritionController {

  async handleSingleDay(request: FastifyRequest, reply: FastifyReply) {
    const data = request.body as SingleDayRequestProps;

    const generatePlan = new GenerateSingleDayPlanService();

    const nutritionPlan = await generatePlan.execute({
      
      ...data, 
      
      diaDaSemana: data.diaDaSemana,
      indiceAlternativa: data.indiceAlternativa,
    });

    reply.send(nutritionPlan);
  }
}

export { CreateNutritionController }