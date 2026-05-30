import { IsNotEmpty, IsUUID } from 'class-validator';

export class AdminAddMembershipDto {
  @IsUUID('4')
  @IsNotEmpty()
  userId: string;

  @IsUUID('4')
  @IsNotEmpty()
  storeId: string;
}
