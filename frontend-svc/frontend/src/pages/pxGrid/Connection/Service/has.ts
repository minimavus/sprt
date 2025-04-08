import type { PxGridService } from "@/hooks/pxgrid/schemas";

export const hasRest = (service: PxGridService): boolean =>
  service?.rest?.length > 0;

export const hasTopics = (service: PxGridService): boolean =>
  service && service?.topics?.length > 0;
