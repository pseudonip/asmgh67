import { useNavigate, useSearchParams } from "@solidjs/router";
import { createSignal } from "solid-js";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from "~/components/ui/text-field";
import { resetPassword, sendPasswordResetEmail } from "~/lib/server/auth.actions";

export default function Reset() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = createSignal("");
  const [error, setError] = createSignal("");

  const [sent, setSent] = createSignal(false);

  const [newPassword, setNewPassword] = createSignal("");
  const [confirmPassword, setConfirmPassword] = createSignal("");

  async function handleReset() {
    setError("");

    try {
      await sendPasswordResetEmail(email());
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred.",
      );

      return;
    }
  }

  async function changePassword() {
    setError("");

    if (newPassword() !== confirmPassword()) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await resetPassword(searchParams.token!, newPassword());
      navigate("/login");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred.",
      );

      return;
    }
  }

  return (
    <main class="w-full h-screen flex px-2">
      <div class="m-auto max-w-sm w-full">
        <Show when={searchParams.token}>
          <Card>
            <CardHeader class="space-y-1">
              <CardTitle class="text-2xl">Change Password</CardTitle>
              <CardDescription>
                Enter your new password below.
              </CardDescription>
            </CardHeader>

            <CardContent class="grid gap-4">
              <TextField class="grid gap-2">
                <TextFieldLabel>New Password</TextFieldLabel>
                <TextFieldInput
                  type="password"
                  value={newPassword()}
                  onInput={(e) => setNewPassword(e.currentTarget.value)}
                />
              </TextField>

              <TextField class="grid gap-2">
                <TextFieldLabel>Confirm Password</TextFieldLabel>
                <TextFieldInput
                  type="password"
                  value={confirmPassword()}
                  onInput={(e) => setConfirmPassword(e.currentTarget.value)}
                />
              </TextField>

              <p class="text-sm text-ctp-red -mb-2">{error()}</p>
            </CardContent>

            <CardFooter>
              <Button class="w-full" onClick={changePassword}>
                Change Password
              </Button>
            </CardFooter>
          </Card>
        </Show>

        <Show when={!searchParams.token}>
          <Show when={!sent()}>
            <Card>
              <CardHeader class="space-y-1">
                <CardTitle class="text-2xl">Reset Password</CardTitle>
                <CardDescription>
                  Enter your email to receive a password reset link.
                </CardDescription>
              </CardHeader>

              <CardContent class="grid gap-4">
                <TextField class="grid gap-2">
                  <TextFieldLabel>Email</TextFieldLabel>
                  <TextFieldInput
                    type="email"
                    placeholder="hi@example.com"
                    value={email()}
                    onInput={(e) => setEmail(e.currentTarget.value)}
                  />
                </TextField>

                <p class="text-sm text-ctp-red -mb-2">{error()}</p>
              </CardContent>

              <CardFooter>
                <Button class="w-full" onClick={handleReset}>
                  Send Reset Link
                </Button>
              </CardFooter>
            </Card>
          </Show>

          <Show when={sent()}>
            <Card>
              <CardHeader class="space-y-1">
                <CardTitle class="text-2xl">Reset Link Sent</CardTitle>
                <CardDescription>
                  A password reset link has been sent to your email.
                </CardDescription>
              </CardHeader>

              <CardFooter>
                <Button class="w-full" onClick={() => navigate("/login")}>
                  Back to Login
                </Button>
              </CardFooter>
            </Card>
          </Show>
        </Show>
      </div>
    </main>
  );
}
