import { User } from '../../users/users.entity';

export type SessionUser = Omit<User, 'password'>;
