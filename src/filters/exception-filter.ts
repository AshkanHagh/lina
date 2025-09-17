import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { LinaError } from "./exception";

@Catch(HttpException)
export class LinaExceptionFilter implements ExceptionFilter {
  private logger = new Logger(LinaExceptionFilter.name);

  catch(exception: LinaError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const statusCode = exception.getStatus();

    this.logger.error({
      message: exception?.message || exception.type,
      error: {
        statusCode,
        type: exception.message,
        cause: exception.cause,
      },
      req: {
        method: req.method,
        path: req.url,
      },
    });

    res.status(statusCode).json({
      statusCode: `${statusCode} ${HttpStatus[statusCode]}`,
      message: exception.message,
    });
  }
}
