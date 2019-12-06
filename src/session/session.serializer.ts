import { PassportSerializer } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

type DoneSerialization = (err: Error, user: any) => void;

type DoneDeserialization = (err: Error, payload: string) => void;

@Injectable()
export class SessionSerializer extends PassportSerializer {
  serializeUser(user: any, done: DoneSerialization) {
    done(null, user);
  }

  deserializeUser(payload: any, done: DoneDeserialization) {
    done(null, payload);
  }
}
