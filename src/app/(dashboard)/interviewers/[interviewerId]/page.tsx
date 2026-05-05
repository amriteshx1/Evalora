import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getQueryClient, trpc } from "@/trpc/server";
import {
  InterviewerIdView,
  InterviewerIdViewError,
  InterviewerIdViewLoading,
} from "@/modules/interviewers/ui/views/interviewer-id-view";

interface Props {
  params: Promise<{ interviewerId: string }>;
}

const Page = async ({ params }: Props) => {
  const { interviewerId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.interviewers.getOne.queryOptions({ id: interviewerId }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<InterviewerIdViewLoading />}>
        <ErrorBoundary fallback={<InterviewerIdViewError />}>
          <InterviewerIdView interviewerId={interviewerId} />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};

export default Page;