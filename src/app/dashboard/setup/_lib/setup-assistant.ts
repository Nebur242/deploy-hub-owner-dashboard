"use client";

import { TechStack } from "@/common/enums/project";
import {
  billingModeOptions,
  deliveryModelOptions,
  deploymentLimitOptions,
  formatAnswer,
  getVisibleSteps,
  isStepComplete,
  launchGoalOptions,
  offerTypeOptions,
  SetupDraft,
  StepConfig,
  StepId,
  supportModelOptions,
  techStackOptions,
} from "./setup-schema";

type CategoryOption = {
  id: string;
  name: string;
};

export type AssistantQuickReply = {
  label: string;
  value: string;
};

const normalize = (value: string) => value.toLowerCase().trim();

const extractNumber = (value: string) => {
  const match = value.replace(/,/g, "").match(/(\d+(\.\d+)?)/);
  return match ? match[1] : "";
};

const findOptionByInput = <T extends string>(
  input: string,
  options: { value: T; label: string; description?: string }[],
  aliases: Record<string, T[]>,
) => {
  const normalized = normalize(input);

  for (const option of options) {
    if (
      normalized === option.value ||
      normalized === option.label.toLowerCase() ||
      normalized.includes(option.label.toLowerCase())
    ) {
      return option.value;
    }
  }

  for (const [needle, values] of Object.entries(aliases)) {
    if (normalized.includes(needle)) {
      return values[0];
    }
  }

  return null;
};

export const getCurrentStep = (draft: SetupDraft): StepConfig | null => {
  const visibleSteps = getVisibleSteps(draft);
  return visibleSteps.find((step) => !isStepComplete(step.id, draft)) ?? null;
};

export const getQuickReplies = (
  stepId: StepId,
  categories: CategoryOption[],
  draft: SetupDraft,
): AssistantQuickReply[] => {
  switch (stepId) {
    case "offerType":
      return offerTypeOptions.map((option) => ({ label: option.label, value: option.value }));
    case "categoryId":
      return categories.slice(0, 6).map((category) => ({ label: category.name, value: category.name }));
    case "techStack":
      return techStackOptions.map((option) => ({ label: option.label, value: option.label }));
    case "deliveryModel":
      return deliveryModelOptions.map((option) => ({ label: option.label, value: option.value }));
    case "supportModel":
      return supportModelOptions.map((option) => ({ label: option.label, value: option.value }));
    case "billingMode":
      return billingModeOptions.map((option) => ({ label: option.label, value: option.value }));
    case "monthlyPrice":
      return [
        { label: "$19 / month", value: "19" },
        { label: "$49 / month", value: "49" },
        { label: "$99 / month", value: "99" },
      ];
    case "yearlyPrice":
      return draft.monthlyPrice
        ? [
            { label: `${Number(draft.monthlyPrice) * 10}/year`, value: `${Number(draft.monthlyPrice) * 10}` },
            { label: `${Number(draft.monthlyPrice) * 12}/year`, value: `${Number(draft.monthlyPrice) * 12}` },
          ]
        : [
            { label: "$190 / year", value: "190" },
            { label: "$490 / year", value: "490" },
            { label: "$990 / year", value: "990" },
          ];
    case "deploymentLimit":
      return deploymentLimitOptions.map((option) => ({ label: option.label, value: option.value }));
    case "launchGoal":
      return launchGoalOptions.map((option) => ({ label: option.label, value: option.value }));
    default:
      return [];
  }
};

export const parseStepReply = (
  stepId: StepId,
  input: string,
  categories: CategoryOption[],
): Partial<SetupDraft> | null => {
  const normalized = normalize(input);

  switch (stepId) {
    case "offerType": {
      const value = findOptionByInput(normalized, offerTypeOptions, {
        single: ["single-project"],
        template: ["template-library"],
        agency: ["agency-service"],
        service: ["agency-service"],
        private: ["private-tool"],
        internal: ["private-tool"],
      });
      return value ? { offerType: value } : null;
    }
    case "ownerLabel":
      return normalized.length >= 2 ? { ownerLabel: input.trim() } : null;
    case "projectName":
      return normalized.length >= 2 ? { projectName: input.trim() } : null;
    case "projectDescription":
      return input.trim().length >= 20 ? { projectDescription: input.trim() } : null;
    case "repository":
      return /^https?:\/\//.test(input.trim()) ? { repository: input.trim() } : null;
    case "categoryId": {
      const matched = categories.find((category) => {
        const categoryName = category.name.toLowerCase();
        return normalized === categoryName || normalized.includes(categoryName) || categoryName.includes(normalized);
      });
      return matched ? { categoryId: matched.id } : null;
    }
    case "techStack": {
      if (normalized.includes("next")) {
        return { techStack: [TechStack.NEXTJS] };
      }
      if (normalized.includes("react")) {
        return { techStack: [TechStack.REACT] };
      }
      return null;
    }
    case "deliveryModel": {
      const value = findOptionByInput(normalized, deliveryModelOptions, {
        self: ["self-serve"],
        assisted: ["owner-assisted"],
        help: ["owner-assisted"],
        done: ["done-for-you"],
      });
      return value ? { deliveryModel: value } : null;
    }
    case "supportModel": {
      const value = findOptionByInput(normalized, supportModelOptions, {
        async: ["async"],
        email: ["async"],
        priority: ["priority"],
        fast: ["priority"],
        hands: ["hands-on"],
        onboarding: ["hands-on"],
      });
      return value ? { supportModel: value } : null;
    }
    case "billingMode": {
      const value = findOptionByInput(normalized, billingModeOptions, {
        free: ["free"],
        month: ["monthly"],
        monthly: ["monthly"],
        year: ["yearly"],
        yearly: ["yearly"],
        both: ["both"],
      });
      return value ? { billingMode: value } : null;
    }
    case "monthlyPrice": {
      const amount = extractNumber(input);
      return Number(amount) > 0 ? { monthlyPrice: amount } : null;
    }
    case "yearlyPrice": {
      const amount = extractNumber(input);
      return Number(amount) > 0 ? { yearlyPrice: amount } : null;
    }
    case "deploymentLimit": {
      const amount = extractNumber(input);
      return Number(amount) >= 5 ? { deploymentLimit: `${Number(amount)}` } : null;
    }
    case "launchGoal": {
      const value = findOptionByInput(normalized, launchGoalOptions, {
        publish: ["publish-fast"],
        pricing: ["validate-pricing"],
        beta: ["private-beta"],
        buyers: ["first-five-buyers"],
        first: ["first-five-buyers"],
      });
      return value ? { launchGoal: value } : null;
    }
    default:
      return null;
  }
};

export const buildAssistantIntro = (draft: SetupDraft) => {
  const currentStep = getCurrentStep(draft);
  if (currentStep) {
    return {
      title: draft.projectName
        ? `I picked up your saved draft for ${draft.projectName}.`
        : "I picked up your shared setup draft.",
      body: `${currentStep.prompt} ${currentStep.helper}`,
    };
  }

  return {
    title: "Your shared setup draft already looks complete.",
    body: "You can refine any answer in the rule-based prototype, or use this conversation to tighten the launch story before handing off to the classic forms.",
  };
};

export const buildAssistantFollowUp = (
  draft: SetupDraft,
  answeredStepId: StepId,
  categoryById: Record<string, string>,
) => {
  const confirmation = `Got it. I saved ${formatAnswer(answeredStepId, draft, categoryById)}.`;
  const nextStep = getCurrentStep(draft);

  if (!nextStep) {
    return {
      confirmation,
      nextPrompt:
        "That gives us a complete setup draft. The right panel should now read like a solid launch brief for the classic project, license, billing, and payout flows.",
    };
  }

  return {
    confirmation,
    nextPrompt: `${nextStep.prompt} ${nextStep.helper}`,
  };
};
