import { ResponsiveDialog } from "@/components/responsive-dialog";
import { MeetingForm } from "./interview-form";
import { InterviewGetOne } from "../../types";

interface UpdateMeetingDialogProps{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialValues: InterviewGetOne;
};

export const UpdateMeetingDialog = ({
    open,
    onOpenChange,
    initialValues,
}: UpdateMeetingDialogProps) => {

    return(
        <ResponsiveDialog
         title="Edit Interview"
         description="Edit the interview details"
         open={open}
         onOpenChange={onOpenChange}
        >
          <MeetingForm 
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
            initialValues={initialValues}
          />
        </ResponsiveDialog>
    );
};
