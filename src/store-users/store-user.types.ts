export type StoreJwtUser = {
  userId: string;
  email: string;
  storeId: string;
};

export type StoreUserJwtPayload = {
  sub: string;
  email: string;
  role: 'user';
  storeId: string;
  type: 'access';
};
