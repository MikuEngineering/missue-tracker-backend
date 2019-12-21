import { IsNotEmpty, IsString, MaxLength, MinLength, Matches } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty({
    message: 'Username is required.'
  })
  @IsString({
    message: 'The type of username must be a string.'
  })
  @MinLength(8, {
    message: 'The length of username must be greater than or equal to 8.'
  })
  @MaxLength(30, {
    message: 'The length of username must be less than or equal to 30.'
  })
  @Matches(/^[0-9a-zA-Z]*$/, {
    message: 'Every letter in username must be either a number or a English letter.'
  })
  readonly username: string;

  @IsNotEmpty({
    message: 'Password is required.'
  })
  @IsString({
    message: 'The type of password must be a string.'
  })
  @MinLength(8, {
    message: 'The length of password must be greater than or equal to 8.'
  })
  readonly password: string;
}
