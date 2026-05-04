"use client";

import { ErrorState } from "@/components/error-state";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CallProvider } from "../components/call-provider";

interface Props{
    interviewId: string;
};

export const CallView = ({
    interviewId
}: Props) => {
    const trpc = useTRPC();
    const { data } = useSuspenseQuery(trpc.interviews.getOne.queryOptions({ id: interviewId }));

    if(data.status === "completed"){
        return (
            <div className="flex h-screen items-center justify-center">
                <ErrorState
                  title="Interview has ended"
                  description="You can no longer join this interview" 
                />
            </div>
        );
    }

    return <CallProvider interviewId={interviewId} meetingName={data.name} />
};