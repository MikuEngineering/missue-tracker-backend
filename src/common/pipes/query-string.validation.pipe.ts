
import { createParamDecorator, BadRequestException } from '@nestjs/common';
import { Request } from 'express';

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

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
  })
}

function queryStringPipeHandler(name: string, request: Request) {
  const { query } = request;
  const value = query[name];

  const isEmpty = !value || (value.constructor === String && value.length < 1);

  if (isEmpty) {
    const CODE = 'isNotEmpty';
    const capitializedName = capitalize(name);
    const message = `${capitializedName} is required.`;
    throw createBadRequestException(name, CODE, message);
  }

  return value;
}

export const QueryStringPipe = createParamDecorator(queryStringPipeHandler);
