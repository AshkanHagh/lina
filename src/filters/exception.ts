import { HttpException, HttpStatus } from "@nestjs/common";

export enum LinaErrorType {
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  INVALID_BODY_FIELD = "INVALID_BODY_FIELD",
  EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS",
  REQ_COOLDOWN = "REQ_COOLDOWN",
  NOT_REGISTERED = "NOT_REGISTERED",
  INVALID_TOKEN = "INVALID_TOKEN",
  INVALID_CODE = "INVALID_CODE",
}

export class LinaError extends HttpException {
  constructor(
    public type: LinaErrorType,
    cause?: unknown,
  ) {
    super(type, LinaError.getStatusCode(type), {
      cause,
    });
  }

  static getStatusCode(type: LinaErrorType) {
    switch (type) {
      case LinaErrorType.EMAIL_ALREADY_EXISTS: {
        return HttpStatus.CONFLICT;
      }
      case LinaErrorType.INVALID_BODY_FIELD: {
        return HttpStatus.UNPROCESSABLE_ENTITY;
      }
      case LinaErrorType.REQ_COOLDOWN: {
        return HttpStatus.TOO_MANY_REQUESTS;
      }
      case LinaErrorType.NOT_REGISTERED: {
        return HttpStatus.NOT_FOUND;
      }
      case LinaErrorType.INVALID_CODE:
      case LinaErrorType.INVALID_TOKEN: {
        return HttpStatus.UNAUTHORIZED;
      }
      default: {
        return HttpStatus.INTERNAL_SERVER_ERROR;
      }
    }
  }
}
