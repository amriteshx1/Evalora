import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { interviewsProcessing, interviewTimeoutEnd, smartFollowUp } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [interviewsProcessing, interviewTimeoutEnd, smartFollowUp],
});