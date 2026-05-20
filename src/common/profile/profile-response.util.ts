import { buildPublicImageUrl } from '../images/image-url.util';
import type { Store } from '../../stores/stores.entity';
import type { User } from '../../users/users.entity';

export type StoreProfileDto = {
  id: string;
  subdomain: string;
  title: string;
  description: string | null;
  backgroundImageUrl: string | null;
};

export type PublicStoreOwnerDto = {
  name: string;
  profileImageUrl: string | null;
};

export type PublicStoreProfileDto = StoreProfileDto & {
  owner: PublicStoreOwnerDto;
};

export type UserProfileDto = {
  id: string;
  name: string;
  email: string;
  profileImageUrl: string | null;
};

export function toUserProfileDto(user: User): UserProfileDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profileImageUrl: buildPublicImageUrl(user.profileImageKey),
  };
}

export function toStoreProfileDto(store: Store): StoreProfileDto {
  return {
    id: store.id,
    subdomain: store.subdomain,
    title: store.title,
    description: store.description ?? null,
    backgroundImageUrl: buildPublicImageUrl(store.background),
  };
}

export function toPublicStoreOwnerDto(user: User): PublicStoreOwnerDto {
  return {
    name: user.name,
    profileImageUrl: buildPublicImageUrl(user.profileImageKey),
  };
}

export function toPublicStoreProfileDto(
  store: Store,
  user: User,
): PublicStoreProfileDto {
  return {
    ...toStoreProfileDto(store),
    owner: toPublicStoreOwnerDto(user),
  };
}
