import { useEffect, type FC } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { observer } from "@legendapp/state/react";
import { Button, Group, Modal, Stack, Stepper } from "@mantine/core";
import {
  FormProvider,
  useForm,
  type SubmitErrorHandler,
  type SubmitHandler,
} from "react-hook-form";

import { usePxGridConnectionCreate } from "@/hooks/pxgrid";
import { useDelayedModalState } from "@/hooks/useDelayedModalState";
import { useQueryUser } from "@/hooks/useQueryUser";

import {
  emptyConnection,
  newConnectionSchema,
  type NewConnectionFields,
} from "./form";
import { steps, steps$ } from "./steps";

export const NewConnection: FC = observer(function NewConnectionModal() {
  const { isOpen, onClose } = useDelayedModalState();
  const [user] = useQueryUser();

  const { mutateAsync } = usePxGridConnectionCreate(user);

  const form = useForm<NewConnectionFields>({
    defaultValues: emptyConnection(),
    reValidateMode: "onBlur",
    resolver: zodResolver(newConnectionSchema),
  });

  useEffect(() => {
    steps$.reset();
    form.reset(
      {},
      {
        keepDirtyValues: false,
        keepErrors: false,
        keepDirty: false,
        keepValues: false,
        keepDefaultValues: true,
        keepIsSubmitted: false,
        keepIsSubmitSuccessful: false,
        keepTouched: false,
        keepIsValid: false,
        keepSubmitCount: false,
      },
    );
  }, []);

  const onSubmit: SubmitHandler<NewConnectionFields> = async (values) => {
    try {
      await mutateAsync(values).then(() => onClose());
    } catch (_e) {
      // ...nothing
    }
  };

  const onErr: SubmitErrorHandler<NewConnectionFields> = (errs) => {
    console.log(errs);
  };

  const onNext = async () => {
    form.clearErrors();
    const resolver = zodResolver(
      steps$.current.get().schema,
      { async: false },
      { mode: "sync" },
    );
    const d = await resolver(form.getValues(), undefined, {
      criteriaMode: "all",
      fields: undefined as any,
      shouldUseNativeValidation: false,
    });

    if (Object.keys(d.errors).length > 0) {
      Object.entries(d.errors).forEach(([key, value]) => {
        form.setError(key as any, value as any);
      });
      return;
    }
    return steps$.nextStep();
  };

  const StepDisplay = steps$.current.get().component;

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size="auto"
      title="New pxGrid connection"
    >
      <Stack gap="sm">
        <FormProvider {...form}>
          <Stepper
            active={steps$.currentStep.get() - 1}
            onStepClick={(idx) => steps$.currentStep.set(idx + 1)}
            allowNextStepsSelect={false}
          >
            {steps.map((step) => (
              <Stepper.Step
                key={step.key}
                label={step.title}
                description={step.description}
              />
            ))}
          </Stepper>

          <StepDisplay />

          <Group gap="xs" justify="end">
            <Button
              onClick={onClose}
              variant="default"
              loading={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={
                steps$.hasNextStep.get()
                  ? onNext
                  : form.handleSubmit(onSubmit, onErr)
              }
              loading={form.formState.isSubmitting}
            >
              {steps$.hasNextStep.get() ? "Next" : "Save"}
            </Button>
          </Group>
        </FormProvider>
      </Stack>
    </Modal>
  );
});
