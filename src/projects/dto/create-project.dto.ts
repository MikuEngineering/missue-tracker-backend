import { IsNotEmpty, Matches, MaxLength, IsEnum } from 'class-validator';
import { Privacy } from '../projects.entity';

export class CreateProjectDto {
  @IsNotEmpty({
    message: 'Name must not be empty.'
  })
  @MaxLength(180, {
    message: 'The length of name must be less than or equal to 180.'
  })
  @Matches(/^[\w\-]{1,180}$/, {
    message: 'Every letter in name must be English letters, numbers, underlines, or dashes.'
  })
  readonly name: string;

  @IsNotEmpty({
    message: 'Description must not be empty.'
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
  readonly tags: string[];
}
