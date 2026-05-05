import {z} from "zod";
import { TRPCError } from "@trpc/server";

import { and, count, desc, eq, getTableColumns, ilike } from "drizzle-orm";

import { db } from "@/db";
import { interviewers, interviews } from "@/db/schema";
import { createTRPCRouter, premiumProcedure, protectedProcedure } from "@/trpc/init";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";

import { agentsInsertSchema, agentsUpdateSchema } from "../schemas";

export const interviewersRouter = createTRPCRouter({
    update: protectedProcedure
      .input(agentsUpdateSchema)
      .mutation(async ({ctx, input}) => {
        const [updatedAgent] = await db
          .update(interviewers)
          .set(input)
          .where(
            and(
              eq(interviewers.id, input.id),
              eq(interviewers.userId, ctx.auth.user.id),
            )
          )
          .returning();

        if(!updatedAgent){
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Interviewer not found",
          });
        }

        return updatedAgent;
    }),
    remove: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const [removedAgent] = await db
          .delete(interviewers)
          .where(
            and(
              eq(interviewers.id, input.id),
              eq(interviewers.userId, ctx.auth.user.id),
            )
          )
          .returning();

        if(!removedAgent){
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Interviewer not found",
          });
        }

        return removedAgent;
    }),
    getOne: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query( async ({ input, ctx }) => {
        const [existingAgent] = await db
          .select({
            ...getTableColumns(interviewers),
            interviewCount: db.$count(interviews, eq(interviewers.id, interviews.interviewerId)),
          })
          .from(interviewers)
          .where(
            and(
              eq(interviewers.id, input.id),
              eq(interviewers.userId, ctx.auth.user.id),
            )
          )

          if(!existingAgent){
            throw new TRPCError({code: "NOT_FOUND", message: "Interviewer Not Found"});
          }

        return existingAgent;
    }),
    getMany: protectedProcedure
    .input(z.object({
      page: z.number().default(DEFAULT_PAGE),
      pageSize: z
       .number()
       .min(MIN_PAGE_SIZE)
       .max(MAX_PAGE_SIZE)
       .default(DEFAULT_PAGE_SIZE),
      search: z.string().nullish()
    }))
    .query( async ({ ctx, input }) => {
        const { search, page, pageSize } = input;

        const data = await db
          .select({
            ...getTableColumns(interviewers),
            interviewCount: db.$count(interviews, eq(interviewers.id, interviews.interviewerId)),
          })
          .from(interviewers)
          .where(
            and(
              eq(interviewers.userId, ctx.auth.user.id),
              search ? ilike(interviewers.name, `%${search}%`) : undefined,
            )
          )
          .orderBy(desc(interviewers.createdAt), desc(interviewers.id))
          .limit(pageSize)
          .offset((page - 1) * pageSize)
        
        const [total] = await db
          .select({ count: count() })
          .from(interviewers)
          .where(
            and(
              eq(interviewers.userId, ctx.auth.user.id),
              search ? ilike(interviewers.name, `%${search}%`) : undefined,
            )
          );

        const totalPages = Math.ceil(total.count / pageSize);

        return {
          items: data,
          total: total.count,
          totalPages,
        };
    }),
    create: premiumProcedure("interviewers")
      .input(agentsInsertSchema)
      .mutation(async ({ input, ctx }) => {
        const [createdAgent] = await db
          .insert(interviewers)
          .values({
            ...input,
            userId: ctx.auth.user.id,
          })
          .returning();

          return createdAgent;
      }),
});