import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { VideoIcon } from "lucide-react";

interface Props {
    interviewId: string;
}

export const ActiveState = ({
    interviewId,
}: Props) => {
    return (
        <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
            <EmptyState 
              image="/upcoming.svg"
              title="Interview is active"
              description="Interview will end once all participants have left"
            />
            <div className="flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2 w-full">
                <Button asChild className="w-full lg:w-auto">
                    <Link href={`/call/${interviewId}`}>
                      <VideoIcon />
                      Join interview
                    </Link>
                </Button>
            </div>
        </div>
    )
}