import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  const createHost = (): {
    host: ArgumentsHost;
    response: Pick<Response, 'status' | 'json'>;
  } => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const host = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(response),
      }),
    } as unknown as ArgumentsHost;

    return { host, response };
  };

  it('maps validation errors to a consistent 400 response', () => {
    const { host, response } = createHost();
    const filter = new GlobalExceptionFilter();

    filter.catch(new BadRequestException(['email must be an email']), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({
      code: HttpStatus.BAD_REQUEST,
      message: 'Validation failed',
      details: ['email must be an email'],
    });
  });

  it('maps unknown errors to a safe 500 response', () => {
    const { host, response } = createHost();
    const filter = new GlobalExceptionFilter();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    filter.catch(new Error('database connection failed'), host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith({
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      details: null,
    });
  });
});
