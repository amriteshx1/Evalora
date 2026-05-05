import { ResponsiveDialog } from "@/components/responsive-dialog";

import { AgentForm } from "./interviewer-form";

interface NewAgentDialogProps{
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export const NewAgentDialog = ({
    open,
    onOpenChange,
}: NewAgentDialogProps) => {
    return(
        <ResponsiveDialog
         title="New Interviewer"
         description="Create a new interviewer"
         open={open}
         onOpenChange={onOpenChange}
        >
          <AgentForm 
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        </ResponsiveDialog>
    );
};
