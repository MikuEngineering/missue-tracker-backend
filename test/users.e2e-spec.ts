import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { UsersModule } from '../src/users/users.module';
import { UsersService } from '../src/users/users.service';
import { UsersController } from '../src/users/users.controller';
import { RegisterUserDto } from '../src/users/dto/register_user.dto';
import { User } from '../src/users/users.entity';

describe('UsersController (e2e)', () => {
  let app;
  let service: UsersService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UsersModule],
    })
    .overrideProvider(getRepositoryToken(User)) 
    .useValue({}) // Since focusing on testing UsersController, implement nothing for the repository to get rid of the dependency problem.
    .overrideProvider(UsersService)
    .useValue({}) // Implementation of methods to be mocked are left to each test case.
    .compile();

    service = moduleFixture.get<UsersService>(UsersService);

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/users (POST)', () => {
    it('should handle creating a new user successfully', () => {
      const expected: RegisterUserDto = {
        username: 'SomeoneUsername',
        password: 'SomeonePassword'
      };
  
      // Expect the controller passes the user data to the service.
      service.register = jest.fn(async (user: RegisterUserDto): Promise<boolean> => {
        expect(user.username).toEqual(expected.username);
        expect(user.password).toEqual(expected.password);
        return true;
      });

      return request(app.getHttpServer())
        .post('/users')
        .send({ username: expected.username, password: expected.password })
        .expect(HttpStatus.CREATED);
    });

    it('should handle the failure at creating a new user', () => {
      // Expect the controller passes the user data to the service.
      service.register = jest.fn(async (): Promise<boolean> => {
        // Simulate the user has already exists.
        return false;
      });

      return request(app.getHttpServer())
        .post('/users')
        .send({ username: 'username', password: 'password' })
        .expect(HttpStatus.CONFLICT);
    });
  });
});
