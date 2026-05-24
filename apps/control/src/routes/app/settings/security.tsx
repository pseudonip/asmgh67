import { createSignal } from "solid-js";
import { Button } from "~/components/ui/button";
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from "~/components/ui/text-field";
import { changePassword } from "~/lib/server/auth.actions";

export default function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = createSignal("");
  const [newPassword, setNewPassword] = createSignal("");

  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  async function updatePassword() {
    setError("");
    setSuccess("");

    if (!currentPassword() || !newPassword()) {
      setError("Please fill in both fields.");
      return;
    }

    try {
      await changePassword(currentPassword(), newPassword());

      setCurrentPassword("");
      setNewPassword("");

      setSuccess("Password updated successfully");
    } catch (e) {
      console.error("Failed to change password:", e);
      setError(e instanceof Error ? e.message : "An error occurred while changing your password.");
    }
  }

  return (
    <main class="p-4 px-5 flex flex-col flex-1">
      <div class="bg-card border rounded-xl mb-4">
        <p class="font-semibold p-4 px-6 border-b">Change password</p>

        <div class="p-4 px-6 pb-2 flex gap-4">
          <TextField class="flex-1">
            <TextFieldLabel>Current password</TextFieldLabel>

            <TextFieldInput
              type="password"
              value={currentPassword()}
              onInput={(e) => setCurrentPassword(e.currentTarget.value)}
            />
          </TextField>

          <TextField class="flex-1">
            <TextFieldLabel>New password</TextFieldLabel>

            <TextFieldInput
              type="password"
              value={newPassword()}
              onInput={(e) => setNewPassword(e.currentTarget.value)}
            />
          </TextField>

          <Button onClick={updatePassword} class="ml-auto self-end">
            Update password
          </Button>
        </div>

        <p class="text-sm text-ctp-red px-6">{error()}</p>
        <p class="text-sm text-ctp-green px-6 mb-3">{success()}</p>
      </div>
    </main>
  );
}
