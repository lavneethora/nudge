import { revokeTokens } from "@/lib/gmail/oauth";
import { deleteUserCompletely } from "@/lib/db/queries";
import type { CommandContext } from "../router";

/** Revoke Gmail access: tell Google to invalidate the token, then drop our
 * copy. The account and trial list survive — this only severs inbox access. */
export async function handleDisconnect(ctx: CommandContext): Promise<string> {
  await revokeTokens(ctx.userId);
  return "done. i've disconnected your gmail and deleted the access tokens, so i can't see your inbox anymore. your saved trials are still here. text \"delete\" if you want everything gone.";
}

/** Full account deletion. Hard-deletes every row we hold for this user. */
export async function handleDelete(ctx: CommandContext): Promise<string> {
  // Revoke first — once the user row is gone we no longer have the token to
  // revoke, and leaving a live grant on Google's side would be worse.
  await revokeTokens(ctx.userId);
  await deleteUserCompletely(ctx.userId);
  return "all gone. your gmail access is revoked and i've deleted your account, trials, and message history. nothing left on my end. take care!";
}
