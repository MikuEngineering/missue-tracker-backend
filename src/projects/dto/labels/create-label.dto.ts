import { IsNotEmpty, MaxLength, Length } from 'class-validator';

export class CreateLabelDto {
  @IsNotEmpty({
    message: 'Name is required.'
  })
  @MaxLength(50, {
    message: 'The length of name must be less than or equal to 50.'
  })
  readonly name: string;

  @IsNotEmpty({
    message: 'Description is required.'
  })
  @MaxLength(250, {
    message: 'The length of description must be less than or equal to 250'
  })
  readonly description: string;

  @IsNotEmpty({
    message: 'Color is required.'
  })
  @Length(6, 6, {
    message: 'The length of color must be 6.'
  })
  readonly color: string;
}
