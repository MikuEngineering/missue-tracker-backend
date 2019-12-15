import { PassportSerializer } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ValidateUserDto } from '../auth/dto/validate_user.dto';

type DoneSerialization = (err: Error, id: number) => void;

type DoneDeserialization = (err: Error, payload: ValidateUserDto) => void;

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  serializeUser(user: ValidateUserDto, done: DoneSerialization) {
    done(null, user.id);
  }

  deserializeUser(id: number, done: DoneDeserialization) {
    this.usersService.findOne(id)
      .then((user) => {

        if (!user) {
          done(new Error(`Unable to find the user with id ${id}`), null);
          return;
        }

        // Filter out the password since we don't need it.
        const { password, ...result } = user;

        done(null, result);

      });
  }
}
