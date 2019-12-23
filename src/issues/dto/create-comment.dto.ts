import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty({
    message: 'Content is required.',
  })
  @IsString({
    message: 'The type of content must be a string.',
  })
  readonly content: string
}
