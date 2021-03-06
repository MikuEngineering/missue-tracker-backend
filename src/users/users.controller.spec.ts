import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersModule } from './users.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './users.entity';

describe('Users Controller', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [UsersModule],
    })
    .overrideProvider(getRepositoryToken(User)) 
    .useValue({}) // Since focusing on testing UsersController, implement nothing for the repository to get rid of the dependency problem.
    .overrideProvider(UsersService)
    .useValue({}) // Implementation of methods to be mocked are left to each test case.
    .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
