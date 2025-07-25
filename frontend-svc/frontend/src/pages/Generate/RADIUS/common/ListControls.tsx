import {
  ActionIcon,
  type ActionIconVariant,
  Menu,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconTransferIn, IconTrash, IconUpload } from "@tabler/icons-react";
import { type ChangeEvent, type FC, useCallback, useRef } from "react";

import { getSessionInBulk, useRadiusBulks } from "@/hooks/sessions";
import type { RadiusSession } from "@/hooks/sessions/schemas";
import { useQueryUser } from "@/hooks/useQueryUser";
import { getErrorMessage } from "@/utils/errors";
import { log } from "@/utils/log";
import { toast } from "@/utils/toasts";

type BulkDataSelector = (session: RadiusSession) => string | null;

type ListControlsProps = {
  onChange: (value: string) => void;
  fromFile?: boolean;
  clean?: boolean;
  variant?: ActionIconVariant;
} & (
  | {
      fromBulk?: true;
      bulkDataSelector: BulkDataSelector;
    }
  | {
      fromBulk: false;
      bulkDataSelector?: never;
    }
);

type BaseButtonProps = Pick<ListControlsProps, "variant" | "onChange">;

const FromFileButton: FC<BaseButtonProps> = ({ variant, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChosen = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];

      if (!file) {
        toast.error({ message: "No file selected" });
        return;
      }

      const fileReader = new FileReader();
      fileReader.onloadend = () => {
        const content = fileReader.result;
        if (typeof content !== "string") {
          toast.error({ message: "Failed to read file" });
          return;
        }
        onChange(content);
      };

      fileReader.readAsText(file);
    },
    [onChange],
  );

  return (
    <>
      <input
        type="file"
        style={{ display: "none" }}
        id="file"
        ref={inputRef}
        onChange={handleFileChosen}
      />
      <Tooltip label="Load from a file">
        <ActionIcon
          variant={variant}
          onClick={() => {
            inputRef.current?.click();
          }}
        >
          <IconUpload size={18} />
        </ActionIcon>
      </Tooltip>
    </>
  );
};

type FromBulkButtonProps = BaseButtonProps & {
  bulkDataSelector: BulkDataSelector;
};

const FromBulkButton: FC<FromBulkButtonProps> = ({
  variant,
  onChange,
  bulkDataSelector,
}) => {
  const [user] = useQueryUser();
  const { data, isLoading, error } = useRadiusBulks(user);

  const handleBulkClick = async (server: string, bulk: string | null) => {
    const toastId = toast.loading({ message: "Loading sessions..." });

    try {
      const data = await getSessionInBulk({
        user,
        server,
        proto: "radius",
        bulk: bulk ?? "none",
        pagination: { page: 0, limit: 0 },
      });
      toast.success({ id: toastId, message: "Sessions loaded" });
      onChange(
        data.sessions
          ?.map(bulkDataSelector)
          .filter((v) => v !== null)
          .join("\n") ?? "",
      );
    } catch (error) {
      log.error(error);
      toast.error({
        id: toastId,
        message: "Failed to load sessions",
      });
    }
  };

  return (
    <Menu offset={4}>
      <Menu.Target>
        <Tooltip label="Load from a bulk">
          <ActionIcon variant={variant}>
            <IconTransferIn size={18} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown p={5}>
        {isLoading && <Menu.Item disabled>Loading...</Menu.Item>}
        {error && (
          <Menu.Item disabled color="red">
            Error: {getErrorMessage(error)}
          </Menu.Item>
        )}
        {!isLoading && !error ? (
          !data?.length ? (
            <Menu.Item disabled>No bulks found</Menu.Item>
          ) : (
            <>
              <Menu.Label>Servers</Menu.Label>
              {data?.map((server) => (
                <Menu.Sub key={server.friendly_name ?? server.server}>
                  <Menu.Sub.Target>
                    <Menu.Sub.Item>
                      {server.friendly_name ?? server.server}
                    </Menu.Sub.Item>
                  </Menu.Sub.Target>
                  <Menu.Sub.Dropdown>
                    {server.bulks?.length ? (
                      <>
                        <Menu.Label>Bulks</Menu.Label>
                        {server.bulks.map((bulk) => (
                          <Menu.Item
                            key={bulk.name}
                            onClick={() =>
                              handleBulkClick(server.server, bulk.name)
                            }
                            rightSection={
                              <Text size="xs" c="dimmed" span>
                                ({bulk.sessions} sessions)
                              </Text>
                            }
                            styles={{ itemSection: { alignSelf: "flex-end" } }}
                          >
                            {bulk.name}
                          </Menu.Item>
                        ))}
                      </>
                    ) : (
                      <Menu.Item disabled>No bulks found</Menu.Item>
                    )}
                  </Menu.Sub.Dropdown>
                </Menu.Sub>
              ))}
            </>
          )
        ) : undefined}
      </Menu.Dropdown>
    </Menu>
  );
};

const CleanButton: FC<BaseButtonProps> = ({ variant, onChange }) => (
  <Tooltip label="Clean">
    <ActionIcon variant={variant} onClick={() => onChange("")}>
      <IconTrash size={18} />
    </ActionIcon>
  </Tooltip>
);

export const ListControls: FC<ListControlsProps> = ({
  onChange,
  fromBulk = true,
  fromFile = true,
  clean = true,
  variant = "subtle",
  bulkDataSelector,
}) => {
  return (
    <ActionIcon.Group>
      {fromBulk ? (
        <FromBulkButton
          variant={variant}
          key="from-bulk"
          onChange={onChange}
          bulkDataSelector={bulkDataSelector!}
        />
      ) : null}
      {fromFile ? (
        <FromFileButton variant={variant} key="from-file" onChange={onChange} />
      ) : null}
      {clean ? (
        <CleanButton variant={variant} key="clean" onChange={onChange} />
      ) : null}
    </ActionIcon.Group>
  );
};
