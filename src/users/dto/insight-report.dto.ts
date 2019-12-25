class Slice {
  readonly start: string
  readonly end: string
  readonly issueCount: string
}

export class InsightReportDto {
  readonly slices: Slice[]
}
