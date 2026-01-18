import { AXIOS } from "@/config/api";
import axios from "axios";
import {
  Subscription,
  PlanConfig,
  CreateCheckoutSessionDto,
  UpdateSubscriptionDto,
  CheckoutResponse,
} from "@/common/types/subscription";

const SUBSCRIPTION_URL = "/subscriptions";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const subscriptionService = {
  /**
   * Get the current user's subscription
   */
  async getSubscription(): Promise<Subscription> {
    const response = await AXIOS.get<{ data: Subscription }>(SUBSCRIPTION_URL);
    return response.data.data || response.data;
  },

  /**
   * Get all available subscription plans (public - no auth required)
   */
  async getPublicPlans(): Promise<PlanConfig[]> {
    const response = await axios.get<{ data: PlanConfig[] }>(
      `${API_URL}/plans`,
    );
    return response.data.data || response.data;
  },

  /**
   * Get all available subscription plans (authenticated)
   */
  async getPlans(): Promise<PlanConfig[]> {
    const response = await AXIOS.get<{ data: PlanConfig[] }>(
      `${SUBSCRIPTION_URL}/plans`,
    );
    return response.data.data || response.data;
  },

  /**
   * Create a checkout session to upgrade subscription
   */
  async createCheckoutSession(
    dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutResponse> {
    const response = await AXIOS.post<{ data: CheckoutResponse }>(
      `${SUBSCRIPTION_URL}/checkout`,
      dto,
    );
    return response.data.data || response.data;
  },

  /**
   * Create a billing portal session
   */
  async createPortalSession(): Promise<CheckoutResponse> {
    const response = await AXIOS.post<{ data: CheckoutResponse }>(
      `${SUBSCRIPTION_URL}/portal`,
    );
    return response.data.data || response.data;
  },

  /**
   * Update subscription (cancel/reactivate)
   */
  async updateSubscription(dto: UpdateSubscriptionDto): Promise<Subscription> {
    const response = await AXIOS.put<{ data: Subscription }>(
      SUBSCRIPTION_URL,
      dto,
    );
    return response.data.data || response.data;
  },

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(): Promise<Subscription> {
    const response = await AXIOS.post<{ data: Subscription }>(
      `${SUBSCRIPTION_URL}/cancel`,
    );
    return response.data.data || response.data;
  },

  /**
   * Get management URLs for updating payment method and cancellation
   */
  async getManagementUrls(): Promise<{
    updatePaymentMethod?: string;
    cancel?: string;
  }> {
    const response = await AXIOS.get<{
      data: { updatePaymentMethod?: string; cancel?: string };
    }>(`${SUBSCRIPTION_URL}/management-urls`);
    return response.data.data || response.data;
  },
};
