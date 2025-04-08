import {
  isExtendedUploadRequestError,
  UploadRequestError,
} from "@/hooks/certificates";
import { isProblemJson } from "@/utils/guards/isProblemJson";

export function niceUploadError(
  error: ProgressEvent<EventTarget> | UploadRequestError,
): string {
  if (error instanceof ProgressEvent) {
    return "Unknown error";
  }
  if (isExtendedUploadRequestError(error) && isProblemJson(error.details)) {
    if ("invalid" in error.details && Array.isArray(error.details.invalid)) {
      let expired = 0,
        invalid = 0,
        existing = 0;
      for (const cert of error.details.invalid) {
        switch (cert.invalidation_reason) {
          case "expired":
            expired++;
            break;
          case "exists":
            existing++;
            break;
          default:
            invalid++;
            break;
        }
      }
      const msgParts = [];
      if (expired > 0) msgParts.push(`${expired} expired`);
      if (invalid > 0) msgParts.push(`${invalid} invalid`);
      if (existing > 0) msgParts.push(`${existing} already existing`);
      return "Invalid certificates found: " + msgParts.join(", ") + ".";
    }
    return (
      (error.details.reason as string) ||
      error.details.detail ||
      error.details.detail
    );
  }
  return error.message;
}
