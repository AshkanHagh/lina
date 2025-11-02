import { HttpException, HttpStatus } from "@nestjs/common";

export enum LinaErrorType {
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  INVALID_BODY_FIELD = "INVALID_BODY_FIELD",
  FORBIDDEN = "FORBIDDEN",
  REGISTER_NOT_ENABLED = "REGISTER_NOT_ENABLED",
  FAILED_TO_GENERATE_AUTH_TOKEN = "FAILED_TO_GENERATE_AUTH_TOKEN",
  INVALID_EMAIL_OR_PASSWORD = "INVALID_EMAIL_OR_PASSWORD",
  DECRYPTION_ERROR = "DECRYPTION_ERROR",
  INVALID_TWO_FACTOR_CODE = "INVALID_TWO_FACTOR_CODE",
  TWO_FACTOR_REQUIRED = "TWO_FACTOR_REQUIRED",
  TWO_FACTOR_NOT_ENABLED = "TWO_FACTOR_NOT_ENABLED",
  NO_BACKUP_CODES_AVAILABLE = "NO_BACKUP_CODES_AVAILABLE",
  UNAUTHORIZATION = "UNAUTHORIZATION",
  INVALID_TOKEN = "INVALID_TOKEN",
  TWO_FACTOR_ENABLED = "TWO_FACTOR_ENABLED",
  QRCODE_GENERATION_FAILED = "QRCODE_GENERATION_FAILED",
  SETTING_NOT_FOUND = "SETTING_NOT_FOUND",
  INVALID_STATE = "INVALID_STATE",
  GITHUB_APP_SETUP_FAILED = "GITHUB_APP_SETUP_FAILED",
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
      case LinaErrorType.UNAUTHORIZATION:
      case LinaErrorType.INVALID_EMAIL_OR_PASSWORD:
      case LinaErrorType.INVALID_TOKEN: {
        return HttpStatus.UNAUTHORIZED;
      }
      case LinaErrorType.INVALID_BODY_FIELD: {
        return HttpStatus.UNPROCESSABLE_ENTITY;
      }
      case LinaErrorType.REGISTER_NOT_ENABLED:
      case LinaErrorType.FORBIDDEN: {
        return HttpStatus.FORBIDDEN;
      }
      case LinaErrorType.INVALID_TWO_FACTOR_CODE:
      case LinaErrorType.TWO_FACTOR_REQUIRED:
      case LinaErrorType.TWO_FACTOR_NOT_ENABLED:
      case LinaErrorType.TWO_FACTOR_ENABLED:
      case LinaErrorType.NO_BACKUP_CODES_AVAILABLE: {
        return HttpStatus.BAD_REQUEST;
      }
      case LinaErrorType.SETTING_NOT_FOUND: {
        return HttpStatus.NOT_FOUND;
      }
      case LinaErrorType.INVALID_STATE: {
        return HttpStatus.CONFLICT;
      }
      default: {
        // All unhandled errors will return 500 INTERNAL_SERVER_ERROR
        return HttpStatus.INTERNAL_SERVER_ERROR;
      }
    }
  }
}
