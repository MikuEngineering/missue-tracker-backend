import { IsNotEmpty, IsInt, IsDefined, IsArray, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CommentDto {
  @IsNotEmpty({
    message: 'The content of the first comment is required.',
  })
  @MaxLength(250, {
    message: 'The length of the first comment\'s content must be less than or equal to 250.',
  })
  content: string;
}

export class CreateIssueDto {
  @IsNotEmpty({
    message: 'Title is required.',
  })
  @MaxLength(45, {
    message: 'The length of title must be less than or equal to 45.'
  })
  readonly title: string;

  @Type(() => CommentDto)
  @ValidateNested({
    message: 'The field comment must an object.',
  })
  @IsDefined({
    message: 'The first comment is required.',
  })
  readonly comment: CommentDto;

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
  readonly labels: number[];

  @IsNotEmpty({
    message: 'The field asignees is required.',
  })
  @IsArray({
    message: 'The field labels must be an array of integers.',
  })
  @IsInt({
    each: true,
    message: 'Each value of asignees must be an integer.',
  })
  readonly assignees: number[];
}
