import { IsNotEmpty, MaxLength, IsArray, IsInt, ArrayUnique } from 'class-validator';

export class UpdateIssueDto {
  @IsNotEmpty({
    message: 'Title is required.',
  })
  @MaxLength(45, {
    message: 'The length of title must be less than or equal to 45.'
  })
  readonly title: string;

  @IsNotEmpty({
    message: 'The field labels is required.',
  })
  @IsArray({
    message: 'The field labels must be an array of integers.',
  })
  @IsInt({
    each: true,
    message: 'Each value of labels must be an integer.',
  })
  @ArrayUnique({
    message: 'Each value of labels must be unique.'
  })
  readonly labels: number[];

  @IsNotEmpty({
    message: 'The field asignees is required.',
  })
  @IsArray({
    message: 'The field labels must be an array of integers.',
  })
  @IsInt({
    each: true,
    message: 'Each value of assignees must be an integer.',
  })
  @ArrayUnique({
    message: 'Each value of assignees must be unique.'
  })
  readonly assignees: number[];
}
