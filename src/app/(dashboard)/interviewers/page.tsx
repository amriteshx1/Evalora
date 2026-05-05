import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { loadSearchParams } from "@/modules/interviewers/params";

import { auth } from "@/lib/auth";
import { getQueryClient, trpc } from "@/trpc/server";
import type { SearchParams } from "nuqs";

import { InterviewersListHeader } from "@/modules/interviewers/ui/components/interviewers-list-header";
import {
  InterviewersView,
  InterviewersViewError,
  InterviewersViewLoading,
} from "@/modules/interviewers/ui/views/interviewers-view";

interface Props {
  searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: Props) => {
  const filters = await loadSearchParams(searchParams);

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.interviewers.getMany.queryOptions({ ...filters }));

  return (
    <>
      <InterviewersListHeader />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<InterviewersViewLoading />}>
          <ErrorBoundary fallback={<InterviewersViewError />}>
            <InterviewersView />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </>
  );
};

export default Page;