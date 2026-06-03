import { Shield } from "lucide-solid";
import { createResource, createSignal, Show } from "solid-js";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from "~/components/ui/text-field";
import QRCode from "qrcode";
import {
  changePassword,
  first2FAVerify,
  getLocalsUser,
  setup2FA,
} from "~/lib/server/auth.actions";

export default function SecuritySettings() {
  const [user, { mutate: mutateUser }] = createResource(getLocalsUser);

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
      setError(
        e instanceof Error
          ? e.message
          : "An error occurred while changing your password.",
      );
    }
  }

  const [mfaVerifPassword, setMfaVerifPassword] = createSignal("");
  const [mfaQR, setMfaQR] = createSignal<string | null>(null);
  const [mfaBase32, setMfaBase32] = createSignal<string | null>(null);
  const [verifyOtp, setVerifyOtp] = createSignal("");
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [mfaVerifError, setMfaVerifError] = createSignal("");

  async function enable2FA() {
    try {
      const details = await setup2FA(mfaVerifPassword());

      setMfaQR(await QRCode.toDataURL(details.url));
      setMfaBase32(details.base32);
      setDialogOpen(true);
    } catch (e) {
      console.error("Failed to setup 2FA:", e);

      alert(
        e instanceof Error
          ? e.message
          : "An error occurred while setting up 2FA.",
      );

      setDialogOpen(false);
    }
  }

  async function verify2FA() {
    try {
      await first2FAVerify(verifyOtp());

      setDialogOpen(false);
      mutateUser((prev) => (prev ? { ...prev, mfaEnabled: true } : prev));
    } catch (e) {
      console.error("Failed to verify 2FA:", e);
      setMfaVerifError(
        e instanceof Error
          ? e.message
          : "An error occurred while verifying 2FA.",
      );
    }
  }

  return (
    <>
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

        <div class="bg-card border rounded-xl mb-4">
          <div class="p-4 px-6 border-b">
            <p class="font-semibold">Two-factor authentication</p>
            <p class="text-sm text-muted-foreground">
              We currently only support time-based otp but, we might support
              more in the future
            </p>
          </div>

          <div class="p-4 flex gap-4">
            <div class="rounded-lg border bg-muted/25 p-4 flex w-full">
              <Shield class="bg-muted p-3 rounded-xl my-auto" size={42} />

              <div class="ml-4 leading-none my-auto">
                <div class="flex">
                  <p class="font-semibold my-auto">Time-based OTP</p>
                  <Show
                    when={user()?.mfaEnabled}
                    fallback={
                      <span class="text-[12px] text-ctp-yellow p-1 px-2 rounded-full bg-ctp-yellow/10 ml-2">
                        Disabled
                      </span>
                    }
                  >
                    <span class="text-[12px] text-ctp-green p-1 px-2 rounded-full bg-ctp-green/10 ml-2">
                      Enabled
                    </span>
                  </Show>
                </div>
                <p class="text-sm text-muted-foreground">
                  Apps like Authy, Google Authenticator, etc
                </p>
              </div>

              <Show when={!user()?.mfaEnabled}>
                <TextField class="ml-auto my-auto">
                  <TextFieldLabel>Password</TextFieldLabel>
                  <TextFieldInput
                    type="password"
                    value={mfaVerifPassword()}
                    onInput={(e) => {
                      setMfaVerifPassword(e.currentTarget.value);

                      document.getElementById("2fa-btn")!.disabled =
                        !e.currentTarget.value;
                    }}
                  />
                </TextField>

                <Button
                  onClick={enable2FA}
                  class="ml-2 self-end"
                  variant="outline"
                  disabled
                  id="2fa-btn"
                >
                  <Shield size={16} class="mr-2" />
                  <p class="mb-px leading-none">Enable</p>
                </Button>
              </Show>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={dialogOpen()} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable 2FA</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app and enter the
              generated code to enable 2FA
            </DialogDescription>
          </DialogHeader>

          <div>
            <Show when={mfaQR()}>
              <div class="rounded-xl border p-4 bg-muted/25 mx-auto w-fit">
                <img src={mfaQR()!} class="rounded-xl" />
              </div>
            </Show>

            <Show when={mfaBase32()}>
              <p class="text-sm mt-2 text-muted-foreground mb-1">
                Or add it manually:
              </p>
              <div class="bg-card border rounded-lg p-2 px-4 font-mono!">
                {mfaBase32()}
              </div>
            </Show>

            <TextField class="mt-6">
              <TextFieldLabel>Generated code</TextFieldLabel>
              <TextFieldInput
                value={verifyOtp()}
                onInput={(e) => setVerifyOtp(e.currentTarget.value)}
                placeholder="123456"
              />
            </TextField>

            <p class="text-sm text-ctp-red mt-3">{mfaVerifError()}</p>

            <Button
              onClick={verify2FA}
              class="mt-4 w-full"
              variant="outline"
              disabled={!verifyOtp()}
            >
              Verify and enable
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
