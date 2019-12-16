import { MaxLength } from 'class-validator';

export class RegisterUserDto {
  @MaxLength(180)
  readonly nickname: string = '';

  @MaxLength(250)
  readonly biology: string = '';
}
