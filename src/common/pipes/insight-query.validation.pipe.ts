
import { createParamDecorator, BadRequestException } from '@nestjs/common';
import { Request } from 'express';

function createBadRequestException(
  name: string,
  code: string,
  message: string
): BadRequestException
{
  return new BadRequestException({
    type: 'query',
    field: [name],
    code,
    message,
  });
}

function validateAndTransformDateFormat(raw, name: string) {
  if (raw) {
    if (raw.constructor !== String) {
      throw createBadRequestException(
        name,
        'isString',
        `The query parameter ${name} must be a date string.`,
      );
    }

    const date = new Date(raw);
    if (isNaN(date.getTime())) {
      throw createBadRequestException(
        name,
        'isDate',
        `The query parameter ${name} must be a valid date string.`,
      )
    }

    return date;
  }
  return null;
}

function validateAndTransformStepFormat(raw, name: string) {
  if (raw) {
    const step = Number(raw);
    if (isNaN(step) && Number.isInteger(step) && step > 0) {
      throw createBadRequestException(
        name,
        'isPositiveInteger',
        `The query parameter step must be an positive integer.`,
      );
    }
    return step;
  }
  return null;
}

function queryStringPipeHandler(data: Object, request: Request) {
  const query = request.query;
  if (!query) {
    return {};
  }

  let start = validateAndTransformDateFormat(query.start, 'start');
  let end = validateAndTransformDateFormat(query.end, 'start');
  let step = validateAndTransformStepFormat(query.step, 'step');

  if (end < start) {
    throw createBadRequestException(
      'start',
      'isValidPeriod',
      `The value of the query parameter start should less than end`,
    );
  }

  return { start, end, step };
}

export const QueryInsightPipe = createParamDecorator(queryStringPipeHandler);
