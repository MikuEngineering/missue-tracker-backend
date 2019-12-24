import { IsEnum } from 'class-validator';
import { Status } from '../comments.entity';

export class UpdateCommentStatusDto {
  @IsEnum(Status, {
    message: 'The value of status is invalid.',
  })
  readonly status: Status
}
