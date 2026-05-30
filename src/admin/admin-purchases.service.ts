import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { buildPublicImageUrl } from '../common/images/image-url.util';
import { MembershipPurchase } from '../memberships/membership-purchase.entity';
import {
  AdminPurchaseListQueryDto,
  resolveAdminPagination,
  toAdminPaginatedResponse,
} from './admin.dto';

@Injectable()
export class AdminPurchasesService {
  constructor(
    @InjectRepository(MembershipPurchase)
    private readonly purchasesRepository: Repository<MembershipPurchase>,
  ) {}

  async listPurchases(query: AdminPurchaseListQueryDto) {
    const { page, limit, skip } = resolveAdminPagination(query);

    const countQb = this.applyPurchaseFilters(
      this.purchasesRepository
        .createQueryBuilder('purchase')
        .leftJoin('purchase.store', 'store')
        .leftJoin('purchase.user', 'user'),
      query,
    );
    const total = await countQb.getCount();

    const dataQb = this.applyPurchaseFilters(
      this.purchasesRepository
        .createQueryBuilder('purchase')
        .leftJoinAndSelect('purchase.store', 'store')
        .leftJoinAndSelect('purchase.user', 'user'),
      query,
    );
    const purchases = await dataQb
      .orderBy('purchase.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const items = purchases.map((p) => this.toPurchaseListItem(p));
    return toAdminPaginatedResponse(items, total, page, limit);
  }

  async getPurchaseDetail(purchaseId: string) {
    const purchase = await this.purchasesRepository.findOne({
      where: { id: purchaseId },
      relations: { store: true, user: true },
    });
    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    return {
      id: purchase.id,
      invoiceAmount: purchase.invoiceAmount,
      bankAccountNumber: purchase.bankAccountNumber,
      bankAccountName: purchase.bankAccountName,
      status: purchase.status,
      receiptImageUrl: buildPublicImageUrl(purchase.receiptImageKey),
      receiptImageKey: purchase.receiptImageKey,
      createdAt: purchase.createdAt.toISOString(),
      updatedAt: purchase.updatedAt.toISOString(),
      store: purchase.store
        ? {
            id: purchase.store.id,
            subdomain: purchase.store.subdomain,
            title: purchase.store.title,
            isVerified: purchase.store.isVerified,
          }
        : null,
      user: purchase.user
        ? {
            id: purchase.user.id,
            name: purchase.user.name,
            email: purchase.user.email,
            isVerified: purchase.user.isVerified,
          }
        : null,
    };
  }

  private applyPurchaseFilters(
    qb: SelectQueryBuilder<MembershipPurchase>,
    query: AdminPurchaseListQueryDto,
  ): SelectQueryBuilder<MembershipPurchase> {
    if (query.status) {
      qb.andWhere('purchase.status = :status', { status: query.status });
    }

    const search = query.search?.trim();
    if (search) {
      const amount = Number(search);
      if (Number.isInteger(amount) && amount > 0) {
        qb.andWhere(
          '(purchase.invoiceAmount = :amount OR store.subdomain ILIKE :term OR store.title ILIKE :term OR user.email ILIKE :term)',
          { amount, term: `%${search}%` },
        );
      } else {
        qb.andWhere(
          '(store.subdomain ILIKE :term OR store.title ILIKE :term OR user.email ILIKE :term OR user.name ILIKE :term)',
          { term: `%${search}%` },
        );
      }
    }

    return qb;
  }

  private toPurchaseListItem(purchase: MembershipPurchase) {
    return {
      id: purchase.id,
      invoiceAmount: purchase.invoiceAmount,
      status: purchase.status,
      hasReceipt: !!purchase.receiptImageKey,
      createdAt: purchase.createdAt.toISOString(),
      updatedAt: purchase.updatedAt.toISOString(),
      store: purchase.store
        ? {
            id: purchase.store.id,
            subdomain: purchase.store.subdomain,
            title: purchase.store.title,
          }
        : null,
      user: purchase.user
        ? {
            id: purchase.user.id,
            name: purchase.user.name,
            email: purchase.user.email,
          }
        : null,
    };
  }
}
