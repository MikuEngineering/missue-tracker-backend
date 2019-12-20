import { IsEnum } from 'class-validator';
import { Privacy } from '../projects.entity';

export class PrivacyProjectDto {
  @IsEnum(Privacy, {
    message: 'The value of privacy is invalid.'
  })
  privacy: Privacy;
}
