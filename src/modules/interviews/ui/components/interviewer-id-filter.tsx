import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { CommandSelect } from "@/components/command-select";
import { GeneratedAvatar } from "@/components/generated-avatar";

import { useInterviewsFilters } from "../../hooks/use-interviews-filters";

export const AgentIdFilter = () => {
    const [filters, setFilters] = useInterviewsFilters();

    const trpc = useTRPC();

    const[agentSearch, setAgentSearch] = useState("");
    const {data} = useQuery(
        trpc.interviewers.getMany.queryOptions({
            pageSize: 100,
            search: agentSearch,
        }),
    );

    return (
        <CommandSelect 
          className="h-9"
          placeholder="Interviewer"
          options={(data?.items ?? []).map((interviewer) => ({
            id: interviewer.id,
            value: interviewer.id,
            children: (
                <div className="flex items-center gap-x-2">
                    <GeneratedAvatar 
                      seed={interviewer.name}
                      variant="botttsNeutral"
                      className="size-4"
                    />
                    {interviewer.name}
                </div>
            )
          }))}
          onSelect={(value) => setFilters({interviewerId: value})}
          onSearch={setAgentSearch}
          value={filters.interviewerId ?? ""}
        />
    )
};