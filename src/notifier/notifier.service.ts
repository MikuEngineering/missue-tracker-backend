import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { UsersService } from '../users/users.service';

const { LINE_BOT_HOST } = process.env;

@Injectable()
export class NotifierService {
  constructor(private readonly usersService: UsersService) {}

  async sendNotificationByUserIds(userIds: number[], message: string) {
    const availableLineTokens = await this.usersService.readLineTokensByIds(
      userIds,
    );
    const promises = availableLineTokens.map(token =>
      this.sendNotification(token, message),
    );
    Promise.all(promises);
  }

  private async sendNotification(token: string, message: string) {
    try {
      const body = { token, message };
      await axios.post(LINE_BOT_HOST, body, {
        method: 'POST',
      });
    } catch (err) {
      console.error(err.data);
    }
  }
}
