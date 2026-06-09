"use client";

import { Currency, TechStack, Visibility } from "@/common/enums/project";

export const STORAGE_KEY = "owner-guided-setup-draft-v1";

export type OfferType = "single-project" | "template-library" | "agency-service" | "private-tool";
export type DeliveryModel = "self-serve" | "owner-assisted" | "done-for-you";
export type SupportModel = "async" | "priority" | "hands-on";
export type BillingMode = "free" | "monthly" | "yearly" | "both";
export type LaunchGoal = "publish-fast" | "validate-pricing" | "private-beta" | "first-five-buyers";

export type SetupDraft = {
  offerType: OfferType | "";
  ownerLabel: string;
  companyName: string;
  projectName: string;
  projectDescription: string;
  repository: string;
  categoryId: string;
  techStack: TechStack[];
  visibility: Visibility;
  deliveryModel: DeliveryModel | "";
  supportModel: SupportModel | "";
  billingMode: BillingMode | "";
  monthlyPrice: string;
  yearlyPrice: string;
  deploymentLimit: string;
  supportTickets: boolean;
  redeploys: boolean;
  updates: boolean;
  prioritySupport: boolean;
  launchGoal: LaunchGoal | "";
};

export type StepId =
  | "offerType"
  | "ownerLabel"
  | "projectName"
  | "projectDescription"
  | "repository"
  | "categoryId"
  | "techStack"
  | "deliveryModel"
  | "supportModel"
  | "billingMode"
  | "monthlyPrice"
  | "yearlyPrice"
  | "deploymentLimit"
  | "launchGoal";

export type StepConfig = {
  id: StepId;
  chapter: string;
  title: string;
  prompt: string;
  helper: string;
  when?: (draft: SetupDraft) => boolean;
};

export type ChoiceOption<T extends string = string> = {
  value: T;
  label: string;
  description: string;
};

export const offerTypeOptions: ChoiceOption<OfferType>[] = [
  { value: "single-project", label: "Single product", description: "One core project with one main buyer journey." },
  { value: "template-library", label: "Template library", description: "Multiple similar offers with lighter delivery." },
  { value: "agency-service", label: "Agency setup", description: "Owner help stays part of the value." },
  { value: "private-tool", label: "Private/internal", description: "Controlled access matters more than public discovery." },
];

export const deliveryModelOptions: ChoiceOption<DeliveryModel>[] = [
  { value: "self-serve", label: "Self-serve", description: "Buyer handles most of deployment on their own." },
  { value: "owner-assisted", label: "Owner-assisted", description: "You help with the first deployment or tricky cases." },
  { value: "done-for-you", label: "Done for buyer", description: "You stay more involved and charge for confidence." },
];

export const supportModelOptions: ChoiceOption<SupportModel>[] = [
  { value: "async", label: "Async support", description: "Email or tickets, lower-touch, easier to scale." },
  { value: "priority", label: "Priority support", description: "Faster help for paid buyers without full hand-holding." },
  { value: "hands-on", label: "Hands-on onboarding", description: "Support is part of the promise, not just backup." },
];

export const billingModeOptions: ChoiceOption<BillingMode>[] = [
  { value: "free", label: "Free", description: "Use this only if you want to test the flow before pricing." },
  { value: "monthly", label: "Monthly only", description: "Simple entry pricing with one recurring option." },
  { value: "yearly", label: "Yearly only", description: "Good when buyers commit longer and churn should be low." },
  { value: "both", label: "Monthly + yearly", description: "Best default for most owners using one product with two prices." },
];

export const launchGoalOptions: ChoiceOption<LaunchGoal>[] = [
  { value: "publish-fast", label: "Publish fast", description: "Get the first project and license live with minimal debate." },
  { value: "validate-pricing", label: "Validate pricing", description: "Use the route to sharpen the first paid offer." },
  { value: "private-beta", label: "Private beta", description: "Keep things controlled while testing delivery." },
  { value: "first-five-buyers", label: "First five buyers", description: "Optimize for a small, high-learning first cohort." },
];

export const deploymentLimitOptions: ChoiceOption[] = [
  { value: "5", label: "5 deployments", description: "Tight entry plan, low friction." },
  { value: "10", label: "10 deployments", description: "Balanced default for many buyers." },
  { value: "25", label: "25 deployments", description: "Better for agencies or repeated rollout." },
  { value: "50", label: "50 deployments", description: "More generous offer, usually for higher price points." },
];

export const techStackOptions = [
  { label: "Next.js", value: TechStack.NEXTJS },
  { label: "React", value: TechStack.REACT },
];

export const visibilityOptions = [
  { label: "Private", value: Visibility.PRIVATE },
  { label: "Public", value: Visibility.PUBLIC },
  { label: "Featured", value: Visibility.FEATURED },
];

export const defaultDraft = (userName?: string, company?: string): SetupDraft => ({
  offerType: "",
  ownerLabel: userName || "",
  companyName: company || "",
  projectName: "",
  projectDescription: "",
  repository: "",
  categoryId: "",
  techStack: [TechStack.NEXTJS],
  visibility: Visibility.PRIVATE,
  deliveryModel: "",
  supportModel: "",
  billingMode: "",
  monthlyPrice: "",
  yearlyPrice: "",
  deploymentLimit: "5",
  supportTickets: true,
  redeploys: true,
  updates: false,
  prioritySupport: false,
  launchGoal: "",
});

export const steps: StepConfig[] = [
  {
    id: "offerType",
    chapter: "Positioning",
    title: "What are you selling?",
    prompt: "Start with the shape of the business. That helps us recommend the cleanest delivery and pricing setup.",
    helper: "Choose the closest match for your owner workflow.",
  },
  {
    id: "ownerLabel",
    chapter: "Identity",
    title: "How should buyers think about you?",
    prompt: "Give the setup a human label for the owner or studio behind the product.",
    helper: "This can be your own name, a studio name, or the buyer-facing team name.",
  },
  {
    id: "projectName",
    chapter: "Project",
    title: "What is the first project called?",
    prompt: "Let’s anchor the setup around one real project.",
    helper: "Use the name buyers will recognize.",
  },
  {
    id: "projectDescription",
    chapter: "Project",
    title: "How would you describe it in one plain paragraph?",
    prompt: "We want a short description that sounds like a human, not a product page generator.",
    helper: "Focus on outcome, audience, and what gets deployed.",
  },
  {
    id: "repository",
    chapter: "Project",
    title: "Where does the source live?",
    prompt: "The current platform still works best when the repo is explicit, even if buyers never see it.",
    helper: "Paste the GitHub repository URL for the first project.",
  },
  {
    id: "categoryId",
    chapter: "Project",
    title: "What category fits best?",
    prompt: "A simple category helps the project and license feel coherent later.",
    helper: "Pick the closest category for the first version. We can always refine it.",
  },
  {
    id: "techStack",
    chapter: "Project",
    title: "Which stack is the project built on?",
    prompt: "We only need the main stack for now so the setup feels grounded in something real.",
    helper: "Choose the stack you actually deploy today.",
  },
  {
    id: "deliveryModel",
    chapter: "Delivery",
    title: "How do you want deployment to feel for buyers?",
    prompt: "This is the big experience choice: self-serve, owner-assisted, or done-for-you.",
    helper: "Pick the model you want to test first, not every possible future path.",
  },
  {
    id: "supportModel",
    chapter: "Delivery",
    title: "What level of support do you want to promise?",
    prompt: "The owner experience should set expectations clearly before a sale happens.",
    helper: "Support can stay light if that matches your business model.",
  },
  {
    id: "billingMode",
    chapter: "Monetization",
    title: "How should the license be sold?",
    prompt: "We’ll keep this aligned with the Stripe setup: one product, monthly and/or yearly prices under it.",
    helper: "Free is okay for testing. Paid can be monthly, yearly, or both.",
  },
  {
    id: "monthlyPrice",
    chapter: "Monetization",
    title: "What monthly price feels right?",
    prompt: "Give the low-friction entry point if you want monthly enabled.",
    helper: "You can leave pricing strategy rough for now. The goal is a believable first offer.",
    when: (draft) => draft.billingMode === "monthly" || draft.billingMode === "both",
  },
  {
    id: "yearlyPrice",
    chapter: "Monetization",
    title: "What yearly price should buyers see?",
    prompt: "Yearly usually works best when it clearly rewards commitment.",
    helper: "A common starting point is roughly ten months of the monthly price.",
    when: (draft) => draft.billingMode === "yearly" || draft.billingMode === "both",
  },
  {
    id: "deploymentLimit",
    chapter: "Monetization",
    title: "How many deployments should each license include?",
    prompt: "Keep this per license, not pooled. That matches the business model you already chose.",
    helper: "Smaller numbers make lower-price entry easier to understand.",
  },
  {
    id: "launchGoal",
    chapter: "Launch",
    title: "What is the first win you want from this setup?",
    prompt: "This last answer helps frame the next actions so the route feels like guidance instead of a form.",
    helper: "Pick the most immediate goal for the next one to two weeks.",
  },
];

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function applyDraftUpdate<K extends keyof SetupDraft>(
  current: SetupDraft,
  key: K,
  value: SetupDraft[K],
): SetupDraft {
  const next = { ...current, [key]: value };

  if (key === "billingMode") {
    if (value === "free") {
      next.monthlyPrice = "";
      next.yearlyPrice = "";
    }
    if (value === "monthly") {
      next.yearlyPrice = "";
    }
    if (value === "yearly") {
      next.monthlyPrice = "";
    }
  }

  if (key === "supportModel") {
    next.prioritySupport = value === "priority" || value === "hands-on";
    next.supportTickets = true;
  }

  if (key === "deliveryModel") {
    next.updates = value !== "self-serve";
  }

  return next;
}

export function isStepComplete(stepId: StepId, draft: SetupDraft): boolean {
  switch (stepId) {
    case "offerType":
      return Boolean(draft.offerType);
    case "ownerLabel":
      return draft.ownerLabel.trim().length >= 2;
    case "projectName":
      return draft.projectName.trim().length >= 2;
    case "projectDescription":
      return draft.projectDescription.trim().length >= 20;
    case "repository":
      return /^https?:\/\//.test(draft.repository.trim());
    case "categoryId":
      return Boolean(draft.categoryId);
    case "techStack":
      return draft.techStack.length > 0;
    case "deliveryModel":
      return Boolean(draft.deliveryModel);
    case "supportModel":
      return Boolean(draft.supportModel);
    case "billingMode":
      return Boolean(draft.billingMode);
    case "monthlyPrice":
      return Number(draft.monthlyPrice) > 0;
    case "yearlyPrice":
      return Number(draft.yearlyPrice) > 0;
    case "deploymentLimit":
      return Number(draft.deploymentLimit) >= 5;
    case "launchGoal":
      return Boolean(draft.launchGoal);
    default:
      return false;
  }
}

export const getVisibleSteps = (draft: SetupDraft) =>
  steps.filter((step) => (step.when ? step.when(draft) : true));

export function formatAnswer(stepId: StepId, draft: SetupDraft, categoryById: Record<string, string>) {
  switch (stepId) {
    case "offerType":
      return draft.offerType.replace("-", " ");
    case "ownerLabel":
      return draft.ownerLabel;
    case "projectName":
      return draft.projectName;
    case "projectDescription":
      return draft.projectDescription;
    case "repository":
      return draft.repository;
    case "categoryId":
      return categoryById[draft.categoryId] || "Category selected";
    case "techStack":
      return `${draft.techStack.join(", ")} • ${draft.visibility}`;
    case "deliveryModel":
      return draft.deliveryModel.replace("-", " ");
    case "supportModel":
      return draft.supportModel.replace("-", " ");
    case "billingMode":
      return draft.billingMode === "both" ? "monthly and yearly" : draft.billingMode;
    case "monthlyPrice":
      return `${formatMoney(draft.monthlyPrice)}/month`;
    case "yearlyPrice":
      return `${formatMoney(draft.yearlyPrice)}/year`;
    case "deploymentLimit":
      return `${draft.deploymentLimit} deployments per license`;
    case "launchGoal":
      return draft.launchGoal.replace(/-/g, " ");
    default:
      return "Answered";
  }
}

export function formatMoney(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return "$0";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: Currency.USD,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export const getPricingSummary = (draft: SetupDraft) => {
  if (draft.billingMode === "free") {
    return "Free";
  }
  if (draft.billingMode === "both") {
    return `${formatMoney(draft.monthlyPrice)}/month and ${formatMoney(draft.yearlyPrice)}/year`;
  }
  if (draft.billingMode === "monthly") {
    return `${formatMoney(draft.monthlyPrice)}/month`;
  }
  if (draft.billingMode === "yearly") {
    return `${formatMoney(draft.yearlyPrice)}/year`;
  }
  return "Not set";
};

export const getRecommendedNotes = (draft: SetupDraft) =>
  [
    draft.deliveryModel === "owner-assisted"
      ? "Owner-assisted deployment is a strong fit for lower-budget buyers who still need confidence."
      : null,
    draft.billingMode === "both"
      ? "Offering both monthly and yearly creates a clean upgrade path without splitting the product."
      : null,
    draft.billingMode === "free"
      ? "A free license is useful for testing the onboarding path, but it won’t exercise the paid Stripe pricing setup."
      : null,
    Number(draft.deploymentLimit || 0) <= 5
      ? "A tight deployment limit keeps the entry offer easy to explain."
      : "A higher deployment limit makes the license feel more generous, but the entry price should justify it.",
  ].filter(Boolean) as string[];

export const getSummaryChecklist = (draft: SetupDraft) => [
  {
    label: "Offer shape chosen",
    done: Boolean(draft.offerType && draft.deliveryModel),
  },
  {
    label: "First project framed",
    done: Boolean(
      draft.projectName &&
        draft.projectDescription &&
        draft.repository &&
        draft.categoryId &&
        draft.techStack.length > 0,
    ),
  },
  {
    label: "Monetization drafted",
    done:
      draft.billingMode === "free" ||
      (draft.billingMode === "monthly" && Boolean(draft.monthlyPrice)) ||
      (draft.billingMode === "yearly" && Boolean(draft.yearlyPrice)) ||
      (draft.billingMode === "both" && Boolean(draft.monthlyPrice && draft.yearlyPrice)),
  },
  {
    label: "Launch intent clear",
    done: Boolean(draft.launchGoal),
  },
];
