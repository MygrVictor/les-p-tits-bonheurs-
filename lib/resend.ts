import { Resend } from "resend";
import { getEnv } from "@/lib/env";

let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (resendClient) {
    return resendClient;
  }

  const env = getEnv();
  resendClient = new Resend(env.RESEND_API_KEY);
  return resendClient;
}
