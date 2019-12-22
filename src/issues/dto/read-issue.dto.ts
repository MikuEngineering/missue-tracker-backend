export class ReadIssueDto {
  readonly title: string
  readonly number: number
  readonly owner: number
  readonly labels: number[]
  readonly assignees: number[]
  readonly createdTime: string
  readonly updatedTime: string
}
