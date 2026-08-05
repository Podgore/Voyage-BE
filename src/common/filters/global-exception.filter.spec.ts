import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ERROR_MESSAGES } from '../constants/error-messages.constants';
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

  it('returns a 400 response when email validation fails', () => {
    const { host, response } = createHost();
    const filter = new GlobalExceptionFilter();

    filter.catch(new BadRequestException([ERROR_MESSAGES.INVALID_EMAIL]), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({
      code: HttpStatus.BAD_REQUEST,
      message: ERROR_MESSAGES.VALIDATION_FAILED,
      details: [ERROR_MESSAGES.INVALID_EMAIL],
    });
  });

  it('maps unknown errors to a safe 500 response', () => {
    const { host, response } = createHost();
    const filter = new GlobalExceptionFilter();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    filter.catch(new Error(ERROR_MESSAGES.DATABASE_CONNECTION_FAILED), host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith({
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      details: null,
    });
  });
});
