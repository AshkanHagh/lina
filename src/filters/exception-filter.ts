import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { LinaError, LinaErrorType } from "./exception";

@Catch(HttpException)
export class LinaExceptionFilter implements ExceptionFilter {
  private logger = new Logger(LinaExceptionFilter.name);

  catch(exception: LinaError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    this.logger.error(`message: ${exception.type || exception.message}`);
    this.logger.error(exception.cause);

    const statusCode = exception.getStatus();

    res.status(statusCode).json({
      statusCode: `${statusCode} ${HttpStatus[statusCode]}`,
      message: exception.type || LinaErrorType.INTERNAL_SERVER_ERROR,
    });
  }
}
