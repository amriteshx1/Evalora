"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { useRouter } from "next/navigation";

import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";

import { DataPagination } from "../components/data-pagination";
import { DataTable } from "@/components/data-table";
import { columns } from "../components/columns";
import { EmptyState } from "@/components/empty-state";
import { useAgentsFilters } from "../../hooks/use-interviewers-filters";

export const InterviewersView = () => {
    const router = useRouter();
    const [filters, setFilters] = useAgentsFilters();

    const trpc = useTRPC();
    const { data } = useSuspenseQuery(trpc.interviewers.getMany.queryOptions({
        ...filters,
    }));
    
    return (
        <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
            <DataTable 
              data={data.items} 
              columns={columns} 
              onRowClick={(row) => router.push(`/interviewers/${row.id}`)}
            />
            <DataPagination 
              page={filters.page}
              totalPages={data.totalPages}
              onPageChange={(page) => setFilters({ page })}
            />
            {data.items.length === 0 && (
                <EmptyState 
                  title="Create your first interviewer"
                  description="Create an interviewer to join your meetings. Each interviewer will follow your instructions and can interact with participants during the call."
                />
            )}
        </div>
    );
};

export const InterviewersViewLoading = () => {
    return (
        <LoadingState
          title="Loading Interviewers"
          description="This may take a few seconds"
        />
    )
};

export const InterviewersViewError = () => {
    return (
        <ErrorState 
          title="Error Loading Interviewers"
          description="Something went wrong"
        />
    )
};
