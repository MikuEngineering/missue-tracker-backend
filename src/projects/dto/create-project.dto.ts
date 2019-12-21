import { IsNotEmpty, Matches, MaxLength, IsEnum, IsString, ArrayUnique } from 'class-validator';
import { Privacy } from '../projects.entity';

export class CreateProjectDto {
  @IsNotEmpty({
    message: 'Name is required.'
  })
  @MaxLength(45, {
    message: 'The length of name must be less than or equal to 45.'
  })
  @Matches(/^[\w\-]+$/, {
    message: 'Every letter in name must be English letters, numbers, underlines, or dashes.'
  })
  readonly name: string;

  @IsNotEmpty({
    message: 'Description is required.'
  })
  readonly description: string;

  @IsEnum(Privacy, {
    message: 'The value of privacy is invalid.'
  })
  readonly privacy: number;

  @IsNotEmpty({
    each: true,
    message: 'Each value in tags must not be empty.'
  })
  @IsString({
    message: 'Every tag should be a string.',
    each: true,
  })
  @ArrayUnique({
    message: 'Every tag name should be unique.'
  })
  readonly tags: string[];
}
