import {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyRequest,
    FastifyReply
} from 'fastify'
import { CreateNutritionController } from './controllers/CreateNutritionController'

export async function routes(fastify: FastifyInstance, options: FastifyPluginOptions){

    fastify.post("/gerar-plano-dia", async (request: FastifyRequest, reply:FastifyReply) => {
        return new CreateNutritionController().handleSingleDay(request, reply)
    })
}