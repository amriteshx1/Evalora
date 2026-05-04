import { interviewersRouter } from "@/modules/interviewers/server/procedures";
import { interviewsRouter } from "@/modules/interviews/server/procedures";
import { premiumRouter } from "@/modules/premium/server/procedures";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  interviewers: interviewersRouter,
  interviews: interviewsRouter,
  premium: premiumRouter,
});

export type AppRouter = typeof appRouter;