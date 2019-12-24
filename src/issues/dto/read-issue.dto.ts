import { Status } from '../issues.entity';

export class ReadIssueDto {
  readonly title: string
  readonly number: number
  readonly status: Status
  readonly owner: number
  readonly labels: number[]
  readonly assignees: number[]
  readonly createdTime: string
  readonly updatedTime: string
}
