import { useRef, useState, type FC } from "react";
import { observable } from "@legendapp/state";
import { use$ } from "@legendapp/state/react";
import {
  Button,
  Card,
  CloseButton,
  DefaultMantineColor,
  Group,
  Modal,
  Progress,
  rem,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { Dropzone, FileWithPath } from "@mantine/dropzone";
import { IconCloudUpload, IconDownload, IconX } from "@tabler/icons-react";
import bytes from "bytes";

import { useCertificateUpload } from "@/hooks/certificates";
import { useDelayedModalState } from "@/hooks/useDelayedModalState";
import { useQueryUser } from "@/hooks/useQueryUser";
import { toast } from "@/utils/toasts";

import { niceUploadError } from "../utils";
import classes from "./UploadCertificate.module.scss";

type FileAndState = {
  file: FileWithPath;
  progress: number;
  error: string | null;
  started: boolean;
};

const filesWithState$ = observable({
  files: [] as FileAndState[],
  addGenericFiles(files: FileWithPath[]) {
    const newFiles = files.filter((file) => {
      return !filesWithState$.files
        .get()
        .some((f) => f.file.path === file.path);
    });
    filesWithState$.files.push(
      ...newFiles.map((file) => ({
        file,
        progress: 0,
        error: null,
        started: false,
      })),
    );
  },
  deleteByIndex(index: number) {
    filesWithState$.files.set(
      filesWithState$.files.get().filter((_, i) => i !== index),
    );
  },
});

const getFileColor = (file: FileAndState): DefaultMantineColor => {
  if (file.error) return "red";
  if (file.progress === 100) return "green";
  if (file.started) return "blue";
  return "gray";
};

const FileCard: FC<{
  index: number;
}> = ({ index }) => {
  const file = use$(filesWithState$.files[index]);
  return (
    <Card withBorder py="xs" shadow="">
      <Group justify="space-between">
        <Text fw="bold">{file.file.name}</Text>
        <CloseButton
          size="sm"
          onClick={() => {
            filesWithState$.deleteByIndex(index);
          }}
        />
      </Group>
      <Text c="dimmed" mt={rem(4)}>
        {bytes.format(file.file.size, { unitSeparator: " " })}
      </Text>
      {file.error ? (
        <Text c="red" mt={rem(4)}>
          {file.error}
        </Text>
      ) : null}
      <Progress
        value={file.progress}
        color={getFileColor(file)}
        animated={file.started && file.progress < 100}
        mt={rem(4)}
        transitionDuration={100}
      />
    </Card>
  );
};

const Uploader: FC = () => {
  const theme = useMantineTheme();
  const openRef = useRef<() => void>(null);

  const files = use$(filesWithState$.files);

  const previews = files.map((file, index) => {
    return <FileCard key={file.file.name as unknown as string} index={index} />;
  });

  return (
    <>
      <div className={classes.wrapper}>
        <Dropzone
          openRef={openRef}
          onDrop={filesWithState$.addGenericFiles}
          onReject={(rejected) => {
            rejected.forEach((file) => {
              toast.error({
                message: `File ${file.file.name} cannot be uploaded: ${file.errors
                  .map((e) => e.message)
                  .join(", ")}`,
              });
            });
          }}
          className={classes.dropzone}
          radius="md"
          accept={{
            "application/x-pem-file": [".pem"],
            "application/x-x509-ca-cert": [".cer", ".crt", ".der"],
            "application/x-tar": [".tar"],
            "application/zip": [".zip"],
            "application/gzip": [".tar.gz"],
            "text/plain": [".txt", ".log", ".out"],
          }}
          maxSize={5 * 1024 ** 2}
        >
          <div>
            <Group justify="center">
              <Dropzone.Accept>
                <IconDownload
                  size={50}
                  color={theme.colors.blue[6]}
                  stroke={1.5}
                />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX size={50} color={theme.colors.red[6]} stroke={1.5} />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconCloudUpload size={50} stroke={1.5} />
              </Dropzone.Idle>
            </Group>

            <Text ta="center" fw="bold" fz="lg" mt="xl">
              <Dropzone.Accept>Drop files here</Dropzone.Accept>
              <Dropzone.Reject>File less than 5mb</Dropzone.Reject>
              <Dropzone.Idle>Upload certificate(s)</Dropzone.Idle>
            </Text>
            <Text ta="center" fz="sm" mt="xs" c="dimmed">
              Allowed file extensions: .pem, .txt, .log, .out, .cer, .crt, .der,
              .tar, .zip, .tar.gz. <br />
              You can upload "show tech" from ISE as well, all found
              certificates will be saved as trusted.
            </Text>
          </div>
        </Dropzone>
      </div>

      {previews}
    </>
  );
};

const UploadCertificateModal: FC = () => {
  const { isOpen, onClose } = useDelayedModalState();
  const files = use$(filesWithState$.files);
  const [uploading, setUploading] = useState(false);

  const [user] = useQueryUser();
  const { upload } = useCertificateUpload({
    type: "trusted",
    user,
  });

  const onUpload = async () => {
    setUploading(true);
    try {
      await Promise.allSettled(
        files.map((file, idx) => {
          return upload({
            file: file.file,
            onProgress: (event) => {
              filesWithState$.files[idx].progress.set(event.percent || 0);
              filesWithState$.files[idx].started.set(true);
            },
            onError: (error) => {
              filesWithState$.files[idx].error.set(niceUploadError(error));
            },
          });
        }),
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size="xl"
      title="Upload certificate(s)"
    >
      <Stack gap="sm">
        <Uploader />
        <Group justify="end" gap="xs">
          <Button
            variant="default"
            type="button"
            onClick={onClose}
            loading={uploading}
          >
            Close
          </Button>
          <Button
            variant="primary"
            type="button"
            disabled={files.length === 0}
            onClick={onUpload}
            loading={uploading}
          >
            Upload
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export { UploadCertificateModal as UploadTrustedCertificate };
