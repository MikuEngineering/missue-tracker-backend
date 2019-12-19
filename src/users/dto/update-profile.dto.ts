import { MaxLength, IsString, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @IsString({
    message: 'The type of nickname must be string.'
  })
  @MaxLength(180, {
    message: 'The length of nickname must be less than or equal to 180.'
  })
  readonly nickname: string;

  @IsString({
    message: 'The type of nickname must be string.'
  })
  @MaxLength(250, {
    message: 'The length of autobiography must be less than or equal to 250.'
  })
  readonly autobiography: string;

  @IsEmail({}, {
    message: 'The format of your email address is invalid.'
  })
  readonly email: string;
}
