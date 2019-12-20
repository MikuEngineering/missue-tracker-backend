import { IsInt, IsPositive } from 'class-validator';

export class TransferProjectDto {
  @IsInt({
    message: 'Id must be an integer.'
  })
  @IsPositive({
    message: 'The number of id must be positive.'
  })
  readonly id: number;
}
