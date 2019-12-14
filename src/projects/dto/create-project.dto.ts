export class CreateProjectDto {
  readonly name: string;
  readonly description: string;
  readonly privacy: number;
  readonly tags: string[];
}
