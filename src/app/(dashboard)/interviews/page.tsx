import { auth } from "@/lib/auth";
import { InterviewsListHeader } from "@/modules/interviews/ui/components/interviews-list-header";
import {
  InterviewsView,
  InterviewsViewError,
  InterviewsViewLoading,
} from "@/modules/interviews/ui/views/interviews-view";
import { loadSearchParams } from "@/modules/interviews/params";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { SearchParams } from "nuqs/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
  searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: Props) => {
  const filters = await loadSearchParams(searchParams);

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.interviews.getMany.queryOptions({ ...filters }));

  return (
    <>
      <InterviewsListHeader />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<InterviewsViewLoading />}>
          <ErrorBoundary fallback={<InterviewsViewError />}>
            <InterviewsView />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </>
  );
};

export default Page;