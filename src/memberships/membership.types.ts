export type MembershipCode = 'free' | 'plus';

export type LimitValue = number | 'unlimited';

export type MembershipLimits = {
  limitCollection: LimitValue;
  limitCollectionLink: LimitValue;
  canCustomLink: boolean;
  canCustomLinkCollection: boolean;
};

export type MembershipPlanDto = {
  code: MembershipCode;
  name: string;
  priceIdr: number | null;
  durationDays: number | null;
  graceRenewalDays: number | null;
  limits: MembershipLimits;
};

export type StoreMembershipStatusDto = {
  effectiveCode: MembershipCode;
  plan: MembershipPlanDto;
  plusExpiredAt: string | null;
  showWarningAfter: string | null;
  showRenewalWarning: boolean;
  pendingPurchase: {
    id: string;
    invoiceAmount: number;
    bankAccountNumber: string;
    bankAccountName: string;
    status: string;
    createdAt: string;
  } | null;
};

export type PurchasePlusResponse = {
  purchaseId: string;
  invoiceAmount: number;
  bankAccountNumber: string;
  bankAccountName: string;
  message: string;
};
