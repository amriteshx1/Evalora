import { db } from '@/db';
import { interviewers, interviews, user } from '@/db/schema';
import { auth } from '@/lib/auth';
import { polarClient } from '@/lib/polar';
import { MAX_FREE_INTERVIEWERS, MAX_FREE_INTERVIEWS } from '@/modules/premium/constants';
import { initTRPC, TRPCError } from '@trpc/server';
import { count, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { cache } from 'react';
export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  return { userId: 'user_123' };
});
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  // transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const session = await auth.api.getSession ({
    headers: await headers(),
  });

  if(!session){
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  const [currentUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id));

  return next ({
    ctx: {
      ...ctx,
      auth: session,
      authRole: currentUser?.role ?? "recruiter",
    },
  });
});
export const premiumProcedure = (entity: "interviews" | "interviewers") =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const customer = await polarClient.customers.getStateExternal({
      externalId: ctx.auth.user.id,
    });

    const [userInterviews] = await db
      .select({
        count: count(interviews.id),
      })
      .from(interviews)
      .where(eq(interviews.userId, ctx.auth.user.id));

    const [userAgents] = await db 
      .select({
        count: count(interviewers.id),
      })
      .from(interviewers)
      .where(eq(interviewers.userId, ctx.auth.user.id));

    const isPremium = customer.activeSubscriptions.length > 0;
    const isFreeInterviewerLimitReached = userAgents.count >= MAX_FREE_INTERVIEWERS;
    const isFreeInterviewLimitReached = userInterviews.count >= MAX_FREE_INTERVIEWS;

    const shouldThrowInterviewError =
      entity === "interviews" && isFreeInterviewLimitReached && !isPremium;
    const shouldThrowInterviewerError =
      entity === "interviewers" && isFreeInterviewerLimitReached && !isPremium;

    if(shouldThrowInterviewError){
      throw new TRPCError ({
        code: "FORBIDDEN",
        message: "You have reached the maximum number of free interviews",
      });
    }

    if(shouldThrowInterviewerError){
      throw new TRPCError ({
        code: "FORBIDDEN",
        message: "You have reached the maximum number of free interviewers",
      });
    }

    return next({ ctx: { ...ctx, customer } });
  });
  