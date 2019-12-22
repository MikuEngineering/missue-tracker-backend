export class ReadIssueDto {
  readonly title: string
  readonly owner: number
  readonly labels: number[]
  readonly assignees: number[]
  readonly createdTime: string
  readonly updatedTime: string
}
