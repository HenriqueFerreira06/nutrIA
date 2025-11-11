import Fastify from "fastify";
import cors from '@fastify/cors'
import dotenv from 'dotenv'
import { routes } from './routes'

const app = Fastify({ logger: true})
dotenv.config();

app.setErrorHandler((error, request, reply) => {
    const statusCode = (error as any).status || (error as any).statusCode || 400;
    reply.code(statusCode).send({ message: error.message})
})

const start = async () => {
    app.register(cors);
    app.register(routes)


    try{
        await app.listen({
        port: Number(process.env.PORT) || 3333, 
        host:"0.0.0.0"
})
        console.log('servidor rodando no http://localhost:3333')
    }catch(err){
            console.log(err);
        }
}

start();