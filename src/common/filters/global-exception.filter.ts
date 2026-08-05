import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ERROR_MESSAGES,
  VALIDATION_ERROR_MESSAGES,
} from '../constants/error-messages.constants';
import { ErrorResponse } from '../types/error-response.type';
import { HttpExceptionResponse } from '../types/http-exception-response.type';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const errorResponse = this.getErrorResponse(exception);

    response.status(errorResponse.status).json({
      code: errorResponse.status,
      message: errorResponse.message,
      details: errorResponse.details,
    });
  }

  private getErrorResponse(exception: unknown): ErrorResponse {
    if (!(exception instanceof HttpException)) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        details: null,
      };
    }

    const status = exception.getStatus();
    const message = this.getExceptionMessage(exception.getResponse());

    if (Array.isArray(message)) {
      return {
        status,
        message: ERROR_MESSAGES.VALIDATION_FAILED,
        details: message.map((validationMessage) =>
          this.getValidationMessage(validationMessage),
        ),
      };
    }

    return {
      status,
      message: message ?? this.getDefaultMessage(status),
      details: null,
    };
  }

  private getExceptionMessage(
    exceptionResponse: string | object,
  ): string | string[] | undefined {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    return (exceptionResponse as HttpExceptionResponse).message;
  }

  private getDefaultMessage(status: number): string {
    return status >= 500
      ? ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      : ERROR_MESSAGES.REQUEST_FAILED;
  }

  private getValidationMessage(message: string): string {
    return VALIDATION_ERROR_MESSAGES[message] ?? message;
  }
}
