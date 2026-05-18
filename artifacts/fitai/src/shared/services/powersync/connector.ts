import {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector,
  UpdateType,
} from "@powersync/react-native";
import Constants from "expo-constants";

const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:3000";

const POWERSYNC_URL =
  (process.env.EXPO_PUBLIC_POWERSYNC_URL as string | undefined) ?? "";

type TokenGetter = () => Promise<string | null>;
let _getToken: TokenGetter = async () => null;

export function setConnectorTokenGetter(fn: TokenGetter) {
  _getToken = fn;
}

export class RegimeConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const token = await _getToken();
    return {
      endpoint: POWERSYNC_URL,
      token: token ?? "",
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase) {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    const token = await _getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      for (const op of transaction.crud) {
        const record = { ...op.opData, id: op.id };
        const table = op.table;

        switch (op.op) {
          case UpdateType.PUT:
            await fetch(`${API_URL}/api/${table}`, {
              method: "POST",
              headers,
              body: JSON.stringify(record),
            });
            break;
          case UpdateType.PATCH:
            await fetch(`${API_URL}/api/${table}/${op.id}`, {
              method: "PATCH",
              headers,
              body: JSON.stringify(record),
            });
            break;
          case UpdateType.DELETE:
            await fetch(`${API_URL}/api/${table}/${op.id}`, {
              method: "DELETE",
              headers,
            });
            break;
        }
      }
      await transaction.complete();
    } catch (err) {
      console.warn("[PowerSync] uploadData error:", err);
    }
  }
}
