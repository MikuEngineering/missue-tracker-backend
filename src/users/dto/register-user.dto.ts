import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty({
    message: 'Username is required.'
  })
  @IsString({
    message: 'The type of username must be a string.'
  })
  @MaxLength(180, {
    message: 'The length of username must be less than or equal to 180.'
  })
  readonly username: string;

  @IsNotEmpty({
    message: 'Password is required.'
  })
  @IsString({
    message: 'The type of password must be a string.'
  })
  readonly password: string;
}
