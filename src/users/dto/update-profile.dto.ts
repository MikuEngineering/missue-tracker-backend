import { MaxLength, IsString, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @IsString({
    message: 'The type of nickname must be string.'
  })
  @MaxLength(30, {
    message: 'The length of nickname must be less than or equal to 30.'
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
