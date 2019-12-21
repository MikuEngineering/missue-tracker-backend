import { Permission, Status } from '../users.entity';

export class ReadProfileDto {
  username: string
  nickname: string
  email: string
  autobiography: string
  permission: Permission
  status: Status
}
