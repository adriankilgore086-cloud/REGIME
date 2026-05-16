import { useEffect } from "react";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import { useRegisterNotificationToken } from "@workspace/api-client-react";

type NotificationPlatform = "ios" | "android" | "web";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  );
}

function getPlatform(): NotificationPlatform {
  if (Platform.OS === "ios" || Platform.OS === "android") return Platform.OS;
  return "web";
}

export function usePushNotifications(enabled: boolean) {
  const router = useRouter();
  const registerToken = useRegisterNotificationToken();

  useEffect(() => {
    if (!enabled || Platform.OS === "web" || !Device.isDevice) return;

    let mounted = true;

    const register = async () => {
      const existing = await Notifications.getPermissionsAsync();
      const permission =
        existing.status === "granted"
          ? existing
          : await Notifications.requestPermissionsAsync();

      if (permission.status !== "granted" || !mounted) return;

      const token = await Notifications.getExpoPushTokenAsync({ projectId: getProjectId() });
      if (!mounted) return;

      await registerToken.mutateAsync({
        data: {
          token: token.data,
          platform: getPlatform(),
        },
      });
    };

    register().catch(() => {});

    return () => {
      mounted = false;
    };
  }, [enabled, registerToken]);

  useEffect(() => {
    if (!enabled) return;

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = response.notification.request.content.data?.route;
      if (typeof route === "string") {
        router.push(route as never);
      }
    });

    return () => subscription.remove();
  }, [enabled, router]);
}
