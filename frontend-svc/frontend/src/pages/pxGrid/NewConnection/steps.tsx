import { ComponentType } from "react";
import { observable } from "@legendapp/state";
import { z } from "zod";

import { AuthenticationConfig } from "./AuthenticationConfig";
import {
  authFieldsValidator,
  generalFieldsValidator,
  serverVerifyFieldsValidator,
} from "./form";
import { GeneralConfig } from "./GeneralConfig";
import { ServerVerificationConfig } from "./ServerVerificationConfig";

export type Step = {
  key: string;
  title: string;
  description: string;
  schema: z.ZodSchema<any>;
  component: ComponentType;
};

export const steps: Step[] = [
  {
    key: "step-1",
    title: "General",
    description: "Configure server connection",
    schema: generalFieldsValidator,
    component: GeneralConfig,
  },
  {
    key: "step-2",
    title: "Authentication",
    description: "Configure authentication",
    schema: authFieldsValidator,
    component: AuthenticationConfig,
  },
  {
    key: "step-3",
    title: "Server verification",
    description: "Server verification configuration",
    schema: serverVerifyFieldsValidator,
    component: ServerVerificationConfig,
  },
];

export const steps$ = observable({
  totalSteps: () => steps.length,
  currentStep: 1 as number,
  hasNextStep: (): boolean => {
    return steps$.currentStep.get() < steps$.totalSteps.get();
  },
  hasPrevStep: (): boolean => {
    return steps$.currentStep.get() > 1;
  },
  current: (): Step => {
    return steps[steps$.currentStep.get() - 1];
  },
  nextStep() {
    steps$.currentStep.set(steps$.currentStep.get() + 1);
  },
  prevStep() {
    steps$.currentStep.set(steps$.currentStep.get() - 1);
  },
  reset() {
    steps$.currentStep.set(1);
  },
});
