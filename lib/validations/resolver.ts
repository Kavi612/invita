import { FieldValues, Resolver } from "react-hook-form";
import * as z from "zod";

/**
 * Custom Zod resolver that bridges Zod v4 `issues` schema format with React Hook Form.
 * Avoids uncaught exceptions in `@hookform/resolvers/zod` when `error.errors` is undefined.
 */
export function zodResolver<T extends FieldValues = FieldValues>(
  schema: z.ZodType<any, any, any>
): Resolver<T> {
  return async (values) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return {
        values: result.data,
        errors: {},
      };
    }

    const issues = result.error.issues || (result.error as any).errors || [];
    const errors: Record<string, { type: string; message: string }> = {};

    for (const issue of issues) {
      const path = issue.path.join(".") || "root";
      if (!errors[path]) {
        errors[path] = {
          type: issue.code,
          message: issue.message,
        };
      }
    }

    return {
      values: {},
      errors: errors as any,
    };
  };
}
