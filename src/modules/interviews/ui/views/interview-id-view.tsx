"use client";

import { useState } from "react";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { MeetingIdViewHeader } from "../components/interview-id-view-header";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/hooks/use-confirm";
import { UpdateMeetingDialog } from "../components/update-interview-dialog";
import { UpcomingState } from "../components/upcoming-state";
import { ActiveState } from "../components/active-state";
import { CancelledState } from "../components/cancelled-state";
import { ProcessingState } from "../components/processing-state";
import { CompletedState } from "../components/completed-state";

interface Props{
    interviewId: string;
};

export const InterviewIdView = ({ interviewId }: Props) => {
    const trpc = useTRPC();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [updateMeetingDialogOpen, setUpdateMeetingDialogOpen] = useState(false);

    const [RemoveConfirmation, confirmRemove] = useConfirm(
        "Are you sure?",
        "The following action will remove this interview",
    );

    const { data } = useSuspenseQuery(
        trpc.interviews.getOne.queryOptions({ id: interviewId }),
    );

    const removeMeeting = useMutation(
        trpc.interviews.remove.mutationOptions({
            onSuccess: async () => {
                await queryClient.invalidateQueries(trpc.interviews.getMany.queryOptions({}));
                await queryClient.invalidateQueries(
                    trpc.premium.getFreeUsage.queryOptions(),
                );

                router.push("/meetings");
            },
        }),
    );

    const handleRemoveMeeting = async () => {
        const ok = await confirmRemove();

        if(!ok) return;

        await removeMeeting.mutateAsync({ id: interviewId });
    };

    const isActive = data.status === "active";
    const isUpcoming = data.status === "upcoming";
    const isCancelled = data.status === "cancelled";
    const isCompleted = data.status === "completed";
    const isProcessing = data.status === "processing";

    return (
        <>
        <RemoveConfirmation />
        <UpdateMeetingDialog 
          open={updateMeetingDialogOpen}
          onOpenChange={setUpdateMeetingDialogOpen}
          initialValues={data}
        />
        <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
            <MeetingIdViewHeader 
              interviewId={interviewId}
              meetingName={data.name}
              onEdit={() => setUpdateMeetingDialogOpen(true)}
              onRemove={handleRemoveMeeting}
            />
            {isCancelled && <CancelledState />}
            {isProcessing && <ProcessingState />}
            {isCompleted && <CompletedState data={data} />}
            {isActive && <ActiveState interviewId={interviewId} />}
            {isUpcoming && ( 
              <UpcomingState 
                interviewId={interviewId}
              />
            )}
        </div>
        </>
    )
};

export const InterviewIdViewLoading = () => {
    return (
        <LoadingState
          title="Loading Interview"
          description="This may take a few seconds"
        />
    )
};

export const InterviewIdViewError = () => {
    return (
        <ErrorState 
          title="Error Loading Interview"
          description="Please try again later"
        />
    )
};