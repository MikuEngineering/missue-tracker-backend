import { Project } from "../../projects/projects.entity";

export class ValidateUserDto {
  id: number;
  username: string;
  nickname: string;
  email: string;
  status: number;
  permission: number;
  created_date: Date;
  projects: Project[];
}
