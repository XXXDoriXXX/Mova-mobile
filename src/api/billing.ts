import { apiClient } from "./client";
import { newIdempotencyKey } from "@/utils/idempotency-key";
import type {
  BillingSummary,
  Plan,
  PlanCode,
  TopupResponse,
  UsageRecord,
} from "@/types/api";

export async function getBillingSummary(): Promise<BillingSummary> {
  const { data } = await apiClient.get<BillingSummary>("/billing/me");
  return data;
}

export async function listPlans(): Promise<Plan[]> {
  const { data } = await apiClient.get<{ items: Plan[] }>("/billing/plans");
  return data.items;
}

export async function listUsage(params: {
  from?: string;
  to?: string;
} = {}): Promise<UsageRecord[]> {
  const { data } = await apiClient.get<{ items: UsageRecord[] }>(
    "/billing/usage",
    { params },
  );
  return data.items;
}

export async function topup(input: {
  amountCents: number;
  idempotencyKey?: string;
}): Promise<TopupResponse> {
  const key = input.idempotencyKey ?? newIdempotencyKey();
  const { data } = await apiClient.post<TopupResponse>(
    "/billing/topup",
    { amountCents: input.amountCents },
    { meta: { idempotencyKey: key } },
  );
  return data;
}

export async function subscribe(input: {
  planCode: PlanCode;
}): Promise<BillingSummary> {
  const { data } = await apiClient.post<BillingSummary>(
    "/billing/subscribe",
    input,
  );
  return data;
}
