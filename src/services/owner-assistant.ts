import { AXIOS } from "@/config/api";
import type { SetupDraft } from "@/app/dashboard/setup/_lib/setup-schema";

export type OwnerAssistantMessage = {
  role: "user" | "assistant";
  text: string;
};

export type SetupAssistantResponse = {
  assistant_message: string;
  updated_draft: SetupDraft;
  quick_replies: string[];
  suggested_actions: string[];
};

export const ownerAssistantService = {
  async setupChat(payload: {
    draft: SetupDraft;
    user_message?: string;
    messages?: OwnerAssistantMessage[];
  }): Promise<SetupAssistantResponse> {
    const response = await AXIOS.post<{ data: SetupAssistantResponse }>(
      "/owner-assistant/setup/chat",
      payload,
    );

    return response.data.data || response.data;
  },
};
