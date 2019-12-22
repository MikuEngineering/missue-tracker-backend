class CommentDto {
  readonly content: string;
}

export class CreateIssueDto {
  readonly title: string;
  readonly comment: CommentDto;
  readonly projectId: number;
  readonly ownerId: number;
  readonly labelIds: number[];
  readonly assigneeIds: number[];
}
