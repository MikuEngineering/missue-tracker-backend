import { MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @MaxLength(180)
  readonly nickname: string = '';

  @MaxLength(250)
  readonly autobiography: string = '';
}
