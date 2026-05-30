import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'crypto';
import { In, Repository } from 'typeorm';
import { ImageStorageService } from '../common/images/image-storage.service';
import type { MultipartUploadFile } from '../common/multipart/parse-multipart.util';
import { User } from '../users/users.entity';
import { MembershipPurchase } from './membership-purchase.entity';
import { MembershipStore } from './membership-store.entity';
import { Membership } from './membership.entity';
import {
  toMembershipPlanDto,
} from './membership-response.util';
import type {
  MembershipCode,
  MembershipLimits,
  MembershipPlanDto,
  PurchasePlusResponse,
  StoreMembershipStatusDto,
} from './membership.types';

const ADMIN_GRANT_DAYS = 40;
const SHOW_WARNING_AFTER_DAYS = 30;
const PLUS_BASE_PRICE_IDR = 50_000;

@Injectable()
export class MembershipsService {
  private plansCache: Map<MembershipCode, Membership> | null = null;

  constructor(
    @InjectRepository(Membership)
    private readonly membershipsRepository: Repository<Membership>,
    @InjectRepository(MembershipStore)
    private readonly membershipStoresRepository: Repository<MembershipStore>,
    @InjectRepository(MembershipPurchase)
    private readonly purchasesRepository: Repository<MembershipPurchase>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly imageStorage: ImageStorageService,
    private readonly configService: ConfigService,
  ) {}

  async listPlans(): Promise<MembershipPlanDto[]> {
    const plans = await this.loadPlans();
    return ['free', 'plus'].map((code) =>
      toMembershipPlanDto(plans.get(code as MembershipCode)!),
    );
  }

  async getStoreMembershipStatus(
    storeId: string,
  ): Promise<StoreMembershipStatusDto> {
    const plans = await this.loadPlans();
    const effectiveCode = await this.getEffectiveCode(storeId);
    const plan = plans.get(effectiveCode)!;
    const subscription = await this.membershipStoresRepository.findOne({
      where: { storeId },
    });
    const pendingPurchase = await this.purchasesRepository.findOne({
      where: {
        storeId,
        status: In(['pending', 'receipt_submitted']),
      },
      order: { createdAt: 'DESC' },
    });

    const now = Date.now();
    const showRenewalWarning =
      effectiveCode === 'plus' &&
      !!subscription &&
      subscription.showWarningAfter.getTime() <= now &&
      subscription.expiredAt.getTime() > now;

    return {
      effectiveCode,
      plan: toMembershipPlanDto(plan),
      plusExpiredAt:
        effectiveCode === 'plus' && subscription
          ? subscription.expiredAt.toISOString()
          : null,
      showWarningAfter:
        effectiveCode === 'plus' && subscription
          ? subscription.showWarningAfter.toISOString()
          : null,
      showRenewalWarning,
      pendingPurchase: pendingPurchase
        ? {
            id: pendingPurchase.id,
            invoiceAmount: pendingPurchase.invoiceAmount,
            bankAccountNumber: pendingPurchase.bankAccountNumber,
            bankAccountName: pendingPurchase.bankAccountName,
            status: pendingPurchase.status,
            createdAt: pendingPurchase.createdAt.toISOString(),
          }
        : null,
    };
  }

  async getEffectiveLimits(storeId: string): Promise<MembershipLimits> {
    const plans = await this.loadPlans();
    const code = await this.getEffectiveCode(storeId);
    const plan = plans.get(code)!;
    return {
      limitCollection:
        plan.limitCollection === null ? 'unlimited' : plan.limitCollection,
      limitCollectionLink:
        plan.limitCollectionLink === null
          ? 'unlimited'
          : plan.limitCollectionLink,
      canCustomLink: plan.canCustomLink,
      canCustomLinkCollection: plan.canCustomLinkCollection,
    };
  }

  async assertCanUseCustomLink(storeId: string): Promise<void> {
    const limits = await this.getEffectiveLimits(storeId);
    if (!limits.canCustomLink) {
      throw new ForbiddenException(
        'Custom access links require Plus membership',
      );
    }
  }

  async assertCanUseCustomCollectionLink(storeId: string): Promise<void> {
    const limits = await this.getEffectiveLimits(storeId);
    if (!limits.canCustomLinkCollection) {
      throw new ForbiddenException(
        'Custom collection access links require Plus membership',
      );
    }
  }

  async getMaxCollections(storeId: string): Promise<number | 'unlimited'> {
    const limits = await this.getEffectiveLimits(storeId);
    return limits.limitCollection;
  }

  async getMaxLinksPerCollection(storeId: string): Promise<number | 'unlimited'> {
    const limits = await this.getEffectiveLimits(storeId);
    return limits.limitCollectionLink;
  }

  async assertCanCreateCollection(storeId: string, currentCount: number): Promise<void> {
    const max = await this.getMaxCollections(storeId);
    if (max !== 'unlimited' && currentCount >= max) {
      throw new ForbiddenException(`Collection limit reached (${max} per store)`);
    }
  }

  async assertCollectionLinkCount(
    storeId: string,
    linkCount: number,
  ): Promise<void> {
    const max = await this.getMaxLinksPerCollection(storeId);
    if (max !== 'unlimited' && linkCount > max) {
      throw new ForbiddenException(
        `This membership allows up to ${max} links per collection`,
      );
    }
  }

  async purchasePlus(
    storeId: string,
    userId: string,
  ): Promise<PurchasePlusResponse> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, storeId },
    });
    if (!user?.isVerified) {
      throw new ForbiddenException(
        'Only verified store accounts can upgrade to Plus',
      );
    }

    const existingPending = await this.purchasesRepository.findOne({
      where: {
        storeId,
        status: In(['pending', 'receipt_submitted']),
      },
    });
    if (existingPending) {
      return {
        purchaseId: existingPending.id,
        invoiceAmount: existingPending.invoiceAmount,
        bankAccountNumber: existingPending.bankAccountNumber,
        bankAccountName: existingPending.bankAccountName,
        message: 'You already have a pending Plus purchase invoice',
      };
    }

    const bankAccountNumber = this.configService.get<string>(
      'MEMBERSHIP_BANK_ACCOUNT_NUMBER',
    );
    const bankAccountName = this.configService.get<string>(
      'MEMBERSHIP_BANK_ACCOUNT_NAME',
    );
    if (!bankAccountNumber?.trim() || !bankAccountName?.trim()) {
      throw new BadRequestException(
        'Bank account details are not configured for Plus purchases',
      );
    }

    const invoiceAmount = PLUS_BASE_PRICE_IDR + randomInt(100, 999);
    const purchase = await this.purchasesRepository.save(
      this.purchasesRepository.create({
        storeId,
        userId,
        invoiceAmount,
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountName: bankAccountName.trim(),
        status: 'pending',
      }),
    );

    return {
      purchaseId: purchase.id,
      invoiceAmount: purchase.invoiceAmount,
      bankAccountNumber: purchase.bankAccountNumber,
      bankAccountName: purchase.bankAccountName,
      message:
        'Transfer the exact invoice amount, then upload your receipt via confirm-plus',
    };
  }

  async confirmPlus(
    storeId: string,
    userId: string,
    receiptFile: MultipartUploadFile,
  ) {
    const purchase = await this.purchasesRepository.findOne({
      where: {
        storeId,
        userId,
        status: In(['pending', 'receipt_submitted']),
      },
      order: { createdAt: 'DESC' },
    });
    if (!purchase) {
      throw new NotFoundException('No pending Plus purchase found for this store');
    }

    purchase.receiptImageKey =
      await this.imageStorage.saveUploadedFile(receiptFile);
    purchase.status = 'receipt_submitted';
    await this.purchasesRepository.save(purchase);

    return {
      purchaseId: purchase.id,
      status: purchase.status,
      message:
        'Payment receipt submitted. Plus will activate after admin verification',
    };
  }

  async adminAddMembership(userId: string, storeId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId, storeId },
    });
    if (!user) {
      throw new NotFoundException('User does not belong to this store');
    }

    const plans = await this.loadPlans();
    const plusPlan = plans.get('plus')!;

    const now = new Date();
    const expiredAt = new Date(now);
    expiredAt.setDate(expiredAt.getDate() + ADMIN_GRANT_DAYS);

    const showWarningAfter = new Date(now);
    showWarningAfter.setDate(showWarningAfter.getDate() + SHOW_WARNING_AFTER_DAYS);

    let subscription = await this.membershipStoresRepository.findOne({
      where: { storeId },
    });

    if (subscription) {
      subscription.membershipId = plusPlan.id;
      subscription.expiredAt = expiredAt;
      subscription.showWarningAfter = showWarningAfter;
    } else {
      subscription = this.membershipStoresRepository.create({
        storeId,
        membershipId: plusPlan.id,
        expiredAt,
        showWarningAfter,
      });
    }

    await this.membershipStoresRepository.save(subscription);

    await this.purchasesRepository.update(
      {
        storeId,
        status: In(['pending', 'receipt_submitted']),
      },
      { status: 'approved' },
    );

    return this.getStoreMembershipStatus(storeId);
  }

  private async getEffectiveCode(storeId: string): Promise<MembershipCode> {
    const subscription = await this.membershipStoresRepository.findOne({
      where: { storeId },
      relations: { membership: true },
    });
    if (
      subscription &&
      subscription.membership?.code === 'plus' &&
      subscription.expiredAt.getTime() > Date.now()
    ) {
      return 'plus';
    }
    return 'free';
  }

  private async loadPlans(): Promise<Map<MembershipCode, Membership>> {
    if (this.plansCache) {
      return this.plansCache;
    }
    const rows = await this.membershipsRepository.find();
    const map = new Map<MembershipCode, Membership>();
    for (const row of rows) {
      map.set(row.code, row);
    }
    if (!map.has('free') || !map.has('plus')) {
      throw new NotFoundException('Membership plans are not configured');
    }
    this.plansCache = map;
    return map;
  }
}
