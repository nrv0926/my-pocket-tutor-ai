export type PlanName = "single_child" | "family";

export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "past_due"
  | "canceled";

export interface Subscription {
  id: string;
  userId: string;
  planName: PlanName;
  childLimit: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus;
  createdAt: string;
}

export const PLAN_LIMITS: Record<PlanName, number> = {
  single_child: 1,
  family: 4,
};
