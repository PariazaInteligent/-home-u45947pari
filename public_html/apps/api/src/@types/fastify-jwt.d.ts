import '@fastify/jwt'

declare module '@fastify/jwt' {
    interface FastifyJWT {
        user: {
            id: string
            email: string
            role: 'INVESTOR' | 'ADMIN' | 'SUPER_ADMIN' | 'GUEST'
        }
    }
}
