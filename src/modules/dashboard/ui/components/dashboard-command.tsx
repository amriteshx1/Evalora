import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Dispatch, SetStateAction, useState } from "react";

import { CommandResponsiveDialog, CommandInput, CommandItem, CommandList, CommandGroup, CommandEmpty } from "@/components/ui/command";
import { useTRPC } from "@/trpc/client";
import { GeneratedAvatar } from "@/components/generated-avatar";

interface Props {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

export const DashboardCommand = ({ open, setOpen }: Props) => {
    const router = useRouter();
    const [search, setSearch] = useState("");

    const trpc = useTRPC();
    const meetings = useQuery(
        trpc.interviews.getMany.queryOptions({
            search,
            pageSize: 100,
        })
    );
    const interviewers = useQuery(
        trpc.interviewers.getMany.queryOptions({
            search,
            pageSize: 100,
        })
    );

    return (
        <CommandResponsiveDialog shouldFilter={false} open={open} onOpenChange={setOpen}>
            <CommandInput 
             placeholder="Find a interview or interviewer..."
             value={search}
             onValueChange={(value) => setSearch(value)}
            />
            <CommandList>
                <CommandGroup heading="Interviews">
                    <CommandEmpty>
                        <span className="text-muted-foreground text-sm">
                            No meetings found
                        </span>
                    </CommandEmpty>
                    {meetings.data?.items.map((interview) => (
                        <CommandItem
                          onSelect={() => {
                            router.push(`/meetings/${interview.id}`);
                            setOpen(false)
                          }}
                          key={interview.id}
                        >
                            {interview.name}
                        </CommandItem>
                    ))}
                </CommandGroup>
                <CommandGroup heading="Interviewers">
                    <CommandEmpty>
                        <span className="text-muted-foreground text-sm">
                            No interviewers found
                        </span>
                    </CommandEmpty>
                    {interviewers.data?.items.map((interviewer) => (
                        <CommandItem
                          onSelect={() => {
                            router.push(`/interviewers/${interviewer.id}`);
                            setOpen(false)
                          }}
                          key={interviewer.id}
                        >
                            <GeneratedAvatar 
                              seed={interviewer.name}
                              variant="botttsNeutral"
                              className="size-5"
                            />
                            {interviewer.name}
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandResponsiveDialog>
    );
};
