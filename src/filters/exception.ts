import { HttpException, HttpStatus } from "@nestjs/common";

export enum LinaErrorType {
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  INVALID_BODY_FIELD = "INVALID_BODY_FIELD",
  EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS",
  REQ_COOLDOWN = "REQ_COOLDOWN",
  NOT_REGISTERED = "NOT_REGISTERED",
  INVALID_TOKEN = "INVALID_TOKEN",
  INVALID_CODE = "INVALID_CODE",
  INVALID_EMAIL_OR_PASSWORD = "INVALID_EMAIL_OR_PASSWORD",
  ACCOUNT_NO_PASSWORD = "ACCOUNT_NO_PASSWORD",
  QR_CODE_GENERATION_FAILED = "QR_CODE_GENERATION_FAILED",
  TWO_FACTOR_CODE_REQUIRED = "TWO_FACTOR_CODE_REQUIRED",
  INVALID_TWO_FACTOR_CODE = "INVALID_TWO_FACTOR_CODE",
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
      case LinaErrorType.TWO_FACTOR_CODE_REQUIRED:
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
      case LinaErrorType.INVALID_TWO_FACTOR_CODE:
      case LinaErrorType.INVALID_TOKEN:
      case LinaErrorType.INVALID_EMAIL_OR_PASSWORD: {
        return HttpStatus.UNAUTHORIZED;
      }
      case LinaErrorType.ACCOUNT_NO_PASSWORD: {
        return HttpStatus.FORBIDDEN;
      }
      default: {
        return HttpStatus.INTERNAL_SERVER_ERROR;
      }
    }
  }
}
