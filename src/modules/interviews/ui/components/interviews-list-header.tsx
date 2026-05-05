"use client";

import { useState } from "react";
import { PlusIcon, XCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NewMeetingDialog } from "./new-interview-dialog";
import { MeetingsSearchFilter } from "./interviews-search-filter";
import { StatusFilter } from "./status-filter";
import { AgentIdFilter } from "./interviewer-id-filter";
import { useInterviewsFilters } from "../../hooks/use-interviews-filters";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DEFAULT_PAGE } from "@/constants";

export const InterviewsListHeader = () => {
    const [filters, setFilters] = useInterviewsFilters();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const isAnyFilterModified = 
      !!filters.status || !!filters.search || !!filters.interviewerId;

    const onClearFilters = () => {
      setFilters({
        status: null,
        interviewerId: "",
        search: "",
        page: DEFAULT_PAGE,
      });
    };

    return (
      <>
        <NewMeetingDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
            <div className="flex items-center justify-between">
                <h5 className="font-medium text-xl">My Interviews</h5>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <PlusIcon />
                    New Interview
                </Button>
            </div>
            <ScrollArea>
            <div className="flex items-center gap-x-2 p-1">
              <MeetingsSearchFilter />
              <StatusFilter />
              <AgentIdFilter />
              {isAnyFilterModified && (
                <Button variant="outline" onClick={onClearFilters}>
                  <XCircleIcon className="size-4" />
                  Clear
                </Button>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
      </>
    );
};
