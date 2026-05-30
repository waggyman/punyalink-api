import type { Membership } from './membership.entity';
import type {
  LimitValue,
  MembershipLimits,
  MembershipPlanDto,
} from './membership.types';

export function toLimitValue(value: number | null): LimitValue {
  return value === null ? 'unlimited' : value;
}

export function toMembershipLimits(plan: Membership): MembershipLimits {
  return {
    limitCollection: toLimitValue(plan.limitCollection),
    limitCollectionLink: toLimitValue(plan.limitCollectionLink),
    canCustomLink: plan.canCustomLink,
    canCustomLinkCollection: plan.canCustomLinkCollection,
  };
}

export function toMembershipPlanDto(plan: Membership): MembershipPlanDto {
  return {
    code: plan.code,
    name: plan.name,
    priceIdr: plan.priceIdr,
    durationDays: plan.durationDays,
    graceRenewalDays: plan.graceRenewalDays,
    limits: toMembershipLimits(plan),
  };
}

export function isUnlimited(value: LimitValue): boolean {
  return value === 'unlimited';
}

export function resolveNumericLimit(value: LimitValue, fallback: number): number {
  return value === 'unlimited' ? fallback : value;
}
