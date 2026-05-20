import uuid from "react-native-uuid";

export function newIdempotencyKey(): string {
  return uuid.v4() as string;
}
