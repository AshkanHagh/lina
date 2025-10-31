import { HttpException, HttpStatus } from "@nestjs/common";

export enum LinaErrorType {
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  INVALID_BODY_FIELD = "INVALID_BODY_FIELD",
  FORBIDDEN = "FORBIDDEN",
  REGISTER_NOT_ENABLED = "REGISTER_NOT_ENABLED",
  FAILED_TO_GENERATE_AUTH_TOKEN = "FAILED_TO_GENERATE_AUTH_TOKEN",
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
      case LinaErrorType.INVALID_BODY_FIELD: {
        return HttpStatus.UNPROCESSABLE_ENTITY;
      }
      case LinaErrorType.REGISTER_NOT_ENABLED:
      case LinaErrorType.FORBIDDEN: {
        return HttpStatus.FORBIDDEN;
      }
      default: {
        return HttpStatus.INTERNAL_SERVER_ERROR;
      }
    }
  }
}
