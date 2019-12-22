export class CreateCommentDto {
  readonly ownerId: number;
  readonly content: string;
  readonly issueId: number;
}
