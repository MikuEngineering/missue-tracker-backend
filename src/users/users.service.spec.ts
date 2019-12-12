import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './users.entity';
import { Project } from '../projects/projects.entity';
import { UsersModule } from './users.module';

interface IUser {
  id?: number;
  username?: string;
  nickname?: string;
  email?: string;
  password?: string;
  status?: number;
  permission?: number;
  created_date?: Date;
  projects?: Project[];
}

describe('UsersService', () => {
  let service: UsersService;

  let mockStorage: IUser[];

  function initializeMockStorage() {
    const defaultUser = new User();
    defaultUser.id = 1;
    defaultUser.username = 'Test1234';
    defaultUser.nickname = 'Tester';
    defaultUser.email = 'test@email.com';
    defaultUser.password = 'tpsasword';
    defaultUser.status = 0;
    defaultUser.permission = 0;
    defaultUser.created_date = new Date();
    defaultUser.projects = [];

    mockStorage = [defaultUser];
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [UsersModule]
    })
    .overrideProvider(getRepositoryToken(User))
    .useValue({
      create: async (user: IUser) => {
        const newUser = new User();
        const largestId = mockStorage.reduce((largest, user) => user.id > largest ? user.id : largest ,0);
        newUser.id = largestId + 1;
        newUser.username = user.username;
        newUser.nickname = user.nickname;
        newUser.email = 'noreply@example.com';
        newUser.password = user.password;
        newUser.status = 0;
        newUser.permission = 0;
        newUser.created_date = new Date();
        newUser.projects = [];
        return newUser;
      },
      save: async (user: IUser) => {
        const index = mockStorage.findIndex(item => item.id === user.id);
        if (index < 0) {
          mockStorage.push(user);
          return;
        }
        mockStorage[index] = user;
      },
      findOne: async (condition: IUser) => {
        const keys = Object.keys(condition);

        const result = mockStorage.find((user) => {
          return keys.reduce((bool, key) => {
            if (condition[key] !== undefined) {
              return bool && user[key] === condition[key];
            }
            return bool;
          }, true);
        });

        return result;
      }
    })
    .compile();

    initializeMockStorage();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add a new user in the storage', async () => {
    const expected = new User();
    expected.id = 2;
    expected.username = 'Another';
    expected.nickname = 'Another';
    expected.email = 'noreply@example.com';
    expected.password = 'somepassword';
    expected.status = 0;
    expected.permission = 0;
    expected.projects = [];

    await service.register({ username: 'Another', password: 'somepassword' });
    expect(mockStorage.length).toEqual(2);

    const user = mockStorage.find(user => user.id === expected.id);
    expect(user).toBeTruthy();
    expect(user.id).toEqual(expected.id);
    expect(user.username).toEqual(expected.username);
    expect(user.nickname).toEqual(expected.nickname);
    expect(user.email).toEqual(expected.email);
    expect(user.password).toEqual(expected.password);
    expect(user.status).toEqual(expected.status);
    expect(user.permission).toEqual(expected.permission);
    expect(user.projects).toEqual(expected.projects);
  });
});
