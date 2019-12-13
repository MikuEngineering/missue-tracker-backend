import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/users.entity';

describe('AuthService', () => {
  let usersService: UsersService;
  let authService: AuthService;

  let mockedStorage: User[];

  function initializeMockedStorage() {
    const defaultUser: User = {
      id: 1,
      username: 'SomeTester',
      nickname: 'TesterNickname',
      email: 'test@email.com',
      password: 'SomePW123',
      status: 0,
      permission: 0,
      created_date: new Date(),
      projects: []
    };

    mockedStorage = [defaultUser];
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      // UsersService is used by AuthService, so I import it to the providers directly.
      providers: [AuthService, UsersService],
    })
    .overrideProvider(UsersService)
    .useValue({
      findOne: async (username: string) => {
        return mockedStorage.find(user => user.username === username);
      }
    })
    .compile();

    initializeMockedStorage();

    usersService = module.get<UsersService>(UsersService);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('validateUser', () => {
    it('should validate the user successfully and return the user data', async () => {
      const expected = mockedStorage[0];
      const username = expected.username;
      const password = expected.password;
  
      const user = await authService.validateUser(username, password);
  
      expect(user).toBeDefined();
      expect(user.id).toEqual(expected.id);
      expect(user.username).toEqual(expected.username);
      expect(user.nickname).toEqual(expected.nickname);
      expect(user.email).toEqual(expected.email);
      expect(user.status).toEqual(expected.status);
      expect(user.permission).toEqual(expected.permission);
      expect(user.created_date).toEqual(expected.created_date);
      expect(user.projects).toEqual(expected.projects);
    });
  
    it('should be failed to validate user and return null', async () => {
      const user = await authService.validateUser('IDontExist', 'MeNeither');
  
      expect(user).toBeNull();
    });
  })
});
