import { createZodValidationPipe } from "nestjs-zod";
import { LinaError, LinaErrorType } from "src/filters/exception";
import { ZodError } from "zod";

export const ZodValidationPipe = createZodValidationPipe({
  createValidationException: (error: ZodError) => {
    return new LinaError(
      LinaErrorType.INVALID_BODY_FIELD,
      error.flatten().fieldErrors,
    );
  },
}) as unknown;
