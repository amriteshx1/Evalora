import { auth } from "@/lib/auth";
import { CallView } from "@/modules/call/ui/views/call-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ interviewId: string }>;
}

const Page = async ({ params }: Props) => {
  const { interviewId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.interviews.getOne.queryOptions({ id: interviewId }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CallView interviewId={interviewId} />
    </HydrationBoundary>
  );
};

export default Page;