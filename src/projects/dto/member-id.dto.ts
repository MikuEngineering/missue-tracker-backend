import { IsInt } from 'class-validator';

export class MemberIdDto {
  @IsInt({
    message: 'Id must be an integer.'
  })
  id: number;
}
