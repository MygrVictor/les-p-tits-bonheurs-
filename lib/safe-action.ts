import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient({
  handleServerError() {
    return "Une erreur est survenue. Merci de réessayer.";
  },
});
