import OpenAI from "openai";
import { and, eq, not } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

import { 
    MessageNewEvent,
    CallEndedEvent,
    CallTranscriptionReadyEvent,
    CallSessionParticipantLeftEvent,
    CallRecordingReadyEvent,
    CallSessionStartedEvent,
} from "@stream-io/node-sdk";

import { db } from "@/db";
import { interviewers, interviews } from "@/db/schema";
import { streamVideo } from "@/lib/stream-video";
import { inngest } from "@/inngest/client";
import { generateAvatarUri } from "@/lib/avatar";
import { streamChat } from "@/lib/stream-chat";
import { isFreeUser } from "@/lib/isFreeUser";

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function verifySignatureWithSDK(body: string, signature: string): boolean {
    return streamVideo.verifyWebhook(body, signature);
}

export async function POST(req: NextRequest){
    const signature = req.headers.get("x-signature");
    const apiKey = req.headers.get("x-api-key");

    if(!signature || !apiKey){
        return NextResponse.json(
            { error: "Missing signature or API key" },
            {status: 400}
        );
    }

    const body = await req.text();

    if(!verifySignatureWithSDK(body, signature)) {
        return NextResponse.json({error: "Invalid signature"}, { status: 401 });
    }

    let payload: unknown;
    try {
        payload = JSON.parse(body) as Record<string, unknown>;
    } catch {
        return NextResponse.json({error: "Invalid JSON"}, { status: 400 });
    }

    const eventType = (payload as Record<string, unknown>)?.type;

    if(eventType === "call.session_started") {
        const event = payload as CallSessionStartedEvent;
        const interviewId = event.call.custom?.interviewId;

        if(!interviewId){
            return NextResponse.json({ error: "Missing interviewId"}, {status: 400});
        }

        const [existingMeeting] = await db
          .select()
          .from(interviews)
          .where(
            and(
                eq(interviews.id, interviewId),
                not(eq(interviews.status, "completed")),
                not(eq(interviews.status, "active")),
                not(eq(interviews.status, "cancelled")),
                not(eq(interviews.status, "processing")),
            )
          );

        if(!existingMeeting){
            return NextResponse.json({error: "Interview not found"}, {status: 404});
        }

        const userId = existingMeeting.userId; 
        
        if (userId) {
            const freeUser = await isFreeUser(userId);
            
            if (freeUser) {
                
                await inngest.send({
                    name: "interviews/end-call-after-timeout",
                    data: {
                        interviewId: existingMeeting.id,
                    },
                });
            }
        }

        await db
          .update(interviews)
          .set({
            status: "active",
            startedAt: new Date(),
          })
          .where(eq(interviews.id, existingMeeting.id));

        const [existingAgent] = await db
          .select()
          .from(interviewers)
          .where(eq(interviewers.id, existingMeeting.interviewerId));

        if(!existingAgent){
            return NextResponse.json({error: "Interviewer not found"}, {status: 404});
        }

        const call = streamVideo.video.call("default", interviewId);
        const realtimeClient = await streamVideo.video.connectOpenAi({
            call,
            openAiApiKey: process.env.OPENAI_API_KEY!,
            agentUserId: existingAgent.id,
        });

        realtimeClient.updateSession({
            instructions: existingAgent.instructions,
        });
    } else if (eventType === "call.session_participant_left"){
        const event = payload as CallSessionParticipantLeftEvent;
        const interviewId = event.call_cid.split(":")[1];

        if(!interviewId){
            return NextResponse.json({ error: "Missing interviewId"}, {status: 400});
        }

        const call = streamVideo.video.call("default", interviewId);
        await call.end();
    } else if (eventType === "call.session_ended"){
        const event = payload as CallEndedEvent;
        const interviewId = event.call.custom?.interviewId;

        if(!interviewId){
            return NextResponse.json({ error: "Missing interviewId"}, {status: 400});
        }

        await db
          .update(interviews)
          .set({
            status: "processing",
            endedAt: new Date(),
          })
          .where(and(eq(interviews.id, interviewId), eq(interviews.status, "active")));
    } else if (eventType === "call.transcription_ready") {
        const event = payload as CallTranscriptionReadyEvent;
        const interviewId = event.call_cid.split(":")[1];

        const [updatedMeeting] = await db
          .update(interviews)
          .set({
            transcriptUrl: event.call_transcription.url,
          })
          .where(eq(interviews.id, interviewId))
          .returning();

        if(!updatedMeeting) {
            return NextResponse.json({ error: "Interview not found"}, {status: 404});
        }

        await inngest.send({
            name: "interviews/processing",
            data: {
                interviewId: updatedMeeting.id,
                transcriptUrl: updatedMeeting.transcriptUrl,
            },
        });
    } else if (eventType === "call.recording_ready"){
        const event = payload as CallRecordingReadyEvent;
        const interviewId = event.call_cid.split(":")[1];

        await db
          .update(interviews)
          .set({
            recordingUrl: event.call_recording.url,
          })
          .where(eq(interviews.id, interviewId));
    } else if (eventType === "message.new"){
        const event = payload as MessageNewEvent;

        const userId = event.user?.id;
        const channelId = event.channel_id;
        const text = event.message?.text;

        if(!userId || !channelId || !text){
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 },
            );
        }

        const [existingMeeting] = await db
          .select()
          .from(interviews)
          .where(and(eq(interviews.id, channelId), eq(interviews.status, "completed")));

        if(!existingMeeting){
            return NextResponse.json({error: "Interview not found"}, {status: 404});
        }

        const [existingAgent] = await db
          .select()
          .from(interviewers)
          .where(eq(interviewers.id, existingMeeting.interviewerId));
        
        if(!existingAgent){
            return NextResponse.json({error: "Interviewer not found"}, {status: 404});
        }

        if(userId !== existingAgent.id){
            const instructions = `
      You are an AI assistant helping the user revisit a recently completed interview.
      Below is a summary of the interview, generated from the transcript:
      
      ${existingMeeting.summary}
      
      The following are your original instructions from the live interview assistant. Please continue to follow these behavioral guidelines as you assist the user:
      
      ${existingAgent.instructions}
      
      The user may ask questions about the interview, request clarifications, or ask for follow-up actions.
      Always base your responses on the interview summary above.
      
      You also have access to the recent conversation history between you and the user. Use the context of previous messages to provide relevant, coherent, and helpful responses. If the user's question refers to something discussed earlier, make sure to take that into account and maintain continuity in the conversation.
      
      If the summary does not contain enough information to answer a question, politely let the user know.
      
      Be concise, helpful, and focus on providing accurate information from the interview and the ongoing conversation.
      `;

      const channel = streamChat.channel("messaging", channelId);
      await channel.watch();

      const previousMessages = channel.state.messages
        .slice(-5)
        .filter((msg) => msg.text && msg.text.trim() !== "")
        .map<ChatCompletionMessageParam>((message) => ({
            role: message.user?.id === existingAgent.id ? "assistant" : "user",
            content: message.text || "",
        }));

      const GPTResponse = await openaiClient.chat.completions.create({
        messages: [
            {role: "system", content: instructions},
            ...previousMessages,
            {role: "user", content: text},
        ],
        model: "gpt-5-nano",
      });

      const GPTResponseText = GPTResponse.choices[0].message.content;

      if(!GPTResponseText){
        return NextResponse.json(
            {error: "No response from GPT"},
            {status: 400}
        );
      }

      const avatarUrl = generateAvatarUri({
        seed: existingAgent.name,
        variant: "botttsNeutral",
      });

      streamChat.upsertUser({
        id: existingAgent.id,
        name: existingAgent.name,
        image: avatarUrl,
      });

      channel.sendMessage({
        text: GPTResponseText,
        user: {
            id: existingAgent.id,
            name: existingAgent.name,
            image: avatarUrl,
        },
      });
      }  
    }

    return NextResponse.json({status: "ok"});
}