type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export async function sendExpoPush(messages: ExpoPushMessage[]) {
  if (messages.length === 0) return [];

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    throw new Error(`Expo push send failed with ${response.status}`);
  }

  return response.json() as Promise<unknown>;
}
