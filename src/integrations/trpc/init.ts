import { TRPCError, initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { auth } from '@/lib/auth'


export async function createTRPCContext({ req }: { req: Request }) {
  const session = await auth.api.getSession({
    headers: req.headers,
  })

  return {
    session,
  }
}

const t = initTRPC.context<Awaited<ReturnType<typeof createTRPCContext>>>().create({
  transformer: superjson,
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(({ ctx, input, next }) => {
  if (!ctx.session || !ctx.session.user.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  const requestedUserId = (input as { userId?: unknown } | undefined)?.userId
  if (typeof requestedUserId === 'string' && requestedUserId !== ctx.session.user.id) {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  })
})
