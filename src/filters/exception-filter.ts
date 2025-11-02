import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { LinaError } from "./exception";

@Catch(HttpException)
export class LinaExceptionFilter implements ExceptionFilter {
  private logger = new Logger(LinaExceptionFilter.name);

  catch(exception: LinaError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    this.logger.error(`message: ${exception.type || exception.message}`);
    // @ts-expect-error unkown type
    // eslint-disable-next-line
    const errorCauseMsg = exception.cause.message;
    this.logger.error(`cause: ${errorCauseMsg || (exception.cause as string)}`);

    const statusCode = exception.getStatus();

    res.status(statusCode).json({
      statusCode: `${statusCode} ${HttpStatus[statusCode]}`,
      message: exception.message || exception.type,
    });
  }
}
