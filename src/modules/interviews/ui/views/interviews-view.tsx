"use client";

import { DataTable } from "@/components/data-table";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { columns } from "../components/columns";
import { EmptyState } from "@/components/empty-state";
import { useRouter } from "next/navigation";
import { useInterviewsFilters } from "../../hooks/use-interviews-filters";
import { DataPagination } from "@/components/data-pagination";

export const InterviewsView = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const [filters, setFilters] = useInterviewsFilters();

  const { data } = useSuspenseQuery(trpc.interviews.getMany.queryOptions({
    ...filters,
  }));

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
        <DataTable data={data.items} columns={columns} onRowClick={(row) => router.push(`/meetings/${row.id}`)} />
        <DataPagination 
          page={filters.page}
          totalPages={data.totalPages}
          onPageChange={(page) => setFilters({ page })}
        />
        {data.items.length === 0 && (
          <EmptyState 
            title="Create your first interview"
            description="Schedule a interview to connect with others. Each interview lets you collaborate, share ideas, and interact with participants in real time."
          />
        )}
    </div>
  )
};

export const InterviewsViewLoading = () => {
    return (
        <LoadingState
          title="Loading Interviews"
          description="This may take a few seconds"
        />
    )
};

export const InterviewsViewError = () => {
    return (
        <ErrorState 
          title="Error Loading Interviews"
          description="Something went wrong"
        />
    )
};