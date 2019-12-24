import { Permission, Status } from '../users.entity';

export class ReadProfileDto {
  username: string
  nickname: string
  email: string
  autobiography: string
  lineToken: string | null
  permission: Permission
  status: Status
}
