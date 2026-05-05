import { ResponsiveDialog } from "@/components/responsive-dialog";
import { MeetingForm } from "./interview-form";
import { useRouter } from "next/navigation";

interface NewMeetingDialogProps{
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export const NewMeetingDialog = ({
    open,
    onOpenChange,
}: NewMeetingDialogProps) => {
    const router = useRouter();
    return(
        <ResponsiveDialog
         title="New Interview"
         description="Create a new interview"
         open={open}
         onOpenChange={onOpenChange}
        >
          <MeetingForm 
            onSuccess={(id) => {
                onOpenChange(false);
                router.push(`/meetings/${id}`);
            }}
            onCancel={() => onOpenChange(false)}
          />
        </ResponsiveDialog>
    );
};
