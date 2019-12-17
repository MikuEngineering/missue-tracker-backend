import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ErrorRecord } from '../util/error-record-generator';

const FIELD_NAME_ID = 'id';
const CODE_NAME = 'isInt';

const REGEX_VALIDATOR = /^\d+$/;

@Injectable()
export class IdValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype, type }: ArgumentMetadata) {
    if (!metatype || metatype !== Number) {
      return value;
    }

    if (!REGEX_VALIDATOR.test(value)) {
      const errorRecord: ErrorRecord = {
        type,
        field: [FIELD_NAME_ID],
        code: CODE_NAME,
        message: 'The parameter id should be an integer.',
      };

      throw new BadRequestException({ errors: [errorRecord] });
    }

    return Number(value);
  }
}
