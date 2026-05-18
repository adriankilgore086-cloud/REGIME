import { PowerSyncDatabase } from "@powersync/react-native";
import { AppSchema } from "./schema";
import { RegimeConnector, setConnectorTokenGetter } from "./connector";

const POWERSYNC_URL = process.env.EXPO_PUBLIC_POWERSYNC_URL ?? "";
const enabled = !!POWERSYNC_URL;

export { setConnectorTokenGetter };

export const powerSyncDb = enabled
  ? new PowerSyncDatabase({
      schema: AppSchema,
      database: { dbFilename: "regime.db" },
    })
  : null;

export async function connectPowerSync() {
  if (!powerSyncDb || !enabled) return;
  const connector = new RegimeConnector();
  await powerSyncDb.connect(connector);
}

export async function disconnectPowerSync() {
  if (!powerSyncDb) return;
  await powerSyncDb.disconnect();
}
