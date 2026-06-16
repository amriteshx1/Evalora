import { candidatesRouter } from "@/modules/candidates/server/procedures";
import { interviewersRouter } from "@/modules/interviewers/server/procedures";
import { interviewsRouter } from "@/modules/interviews/server/procedures";
import { premiumRouter } from "@/modules/premium/server/procedures";
import { scoreboardRouter } from "@/modules/scoreboard/server/procedures";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  candidates: candidatesRouter,
  interviewers: interviewersRouter,
  interviews: interviewsRouter,
  premium: premiumRouter,
  scoreboard: scoreboardRouter,
});

export type AppRouter = typeof appRouter;
