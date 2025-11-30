// src/lib/membership.ts

export type MembershipStatus = "free" | "vip";

export interface Membership {
  status: MembershipStatus;
  plan?: "weekly" | "monthly" | "lifetime";
  started_at?: string; // ISO string
  expires_at?: string | null; // null = lifetime
}

const STORAGE_KEY = "dramakita_membership_v1";

function safeParse(json: string | null): Membership | null {
  if (!json) return null;
  try {
    const data = JSON.parse(json);
    if (data && typeof data.status === "string") {
      return data as Membership;
    }
    return null;
  } catch {
    return null;
  }
}

export function getMembership(): Membership {
  if (typeof window === "undefined") {
    return { status: "free" };
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = safeParse(raw);
  if (!parsed) {
    return { status: "free" };
  }
  return parsed;
}

export function saveMembership(m: Membership): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
}

export function upgradeToVip(
  plan: "weekly" | "monthly" | "lifetime"
): Membership {
  const now = new Date();
  let expires_at: string | null = null;

  if (plan === "weekly") {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    expires_at = d.toISOString();
  } else if (plan === "monthly") {
    const d = new Date(now);
    d.setMonth(d.getMonth() + 1);
    expires_at = d.toISOString();
  } else if (plan === "lifetime") {
    expires_at = null;
  }

  const membership: Membership = {
    status: "vip",
    plan,
    started_at: now.toISOString(),
    expires_at,
  };

  saveMembership(membership);
  return membership;
}

export function downgradeToFree(): Membership {
  const membership: Membership = { status: "free" };
  saveMembership(membership);
  return membership;
}
