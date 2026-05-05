"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useConfirm } from "@/hooks/use-confirm";
import { AgentIdViewHeader } from "../components/interviewer-id-view-header";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Badge } from "@/components/ui/badge";
import { VideoIcon } from "lucide-react";
import { toast } from "sonner";
import { UpdateAgentDialog } from "../components/update-interviewer-dialog";

interface Props{
    interviewerId: string;
};

export const InterviewerIdView = ({ interviewerId }: Props) => {
    const trpc = useTRPC();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [updateAgentDialogOpen, setUpdateAgentDialogOpen] = useState(false);

    const { data } = useSuspenseQuery(trpc.interviewers.getOne.queryOptions({ id: interviewerId }));

    const removeAgent = useMutation(
        trpc.interviewers.remove.mutationOptions({
            onSuccess: async () => {
                await queryClient.invalidateQueries(trpc.interviewers.getMany.queryOptions({}));
                await queryClient.invalidateQueries(
                    trpc.premium.getFreeUsage.queryOptions(),
                );

                router.push("/interviewers");
            },
            onError: (error) => {
                toast.error(error.message);
            },
        }),
    );

    const [RemoveConfirmation, confirmRemove] = useConfirm(
        "Are you sure?",
        `The following action will remove ${data.interviewCount} associated interviews`,
    );

    const handleRemoveAgent = async () => {
        const ok = await confirmRemove();

        if(!ok) return;

        await removeAgent.mutateAsync({ id: interviewerId });
    };

    return (
        <>
          <RemoveConfirmation />
          <UpdateAgentDialog 
            open={updateAgentDialogOpen}
            onOpenChange={setUpdateAgentDialogOpen}
            initialValues={data}
          />
          <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
              <AgentIdViewHeader 
                interviewerId={interviewerId}
                agentName={data.name}
                onEdit={() => setUpdateAgentDialogOpen(true)}
                onRemove={handleRemoveAgent}
              />
              <div className="bg-white rounded-lg border">
                  <div className="px-4 py-5 gap-y-5 flex flex-col col-span-5">
                      <div className="flex items-center gap-x-3">
                          <GeneratedAvatar 
                            variant="botttsNeutral"
                            seed={data.name}
                            className="size-10"
                          />
                          <h2 className="text-2xl font-medium">{data.name}</h2>
                      </div>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-x-2 [&>svg]:size-4"
                      >
                          <VideoIcon className="text-blue-700" />
                          {data.interviewCount} {data.interviewCount === 1 ? "interview" : "interviews"}
                      </Badge>
                      <div className="flex flex-col gap-y-4">
                          <p className="text-lg font-medium">Instructions</p>
                          <p className="text-neutral-800">{data.instructions}</p>
                      </div>
                  </div>
              </div>
          </div>
        </>
    );
};

export const InterviewerIdViewLoading = () => {
    return (
        <LoadingState
          title="Loading Interviewer"
          description="This may take a few seconds"
        />
    )
};

export const InterviewerIdViewError = () => {
    return (
        <ErrorState 
          title="Error Loading Interviewer"
          description="Something went wrong"
        />
    )
};
