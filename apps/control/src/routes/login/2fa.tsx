import { useNavigate } from "@solidjs/router";
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
  OTPField,
  OTPFieldGroup,
  OTPFieldInput,
  OTPFieldSeparator,
  OTPFieldSlot,
} from "~/components/ui/otp-field";
import { verify2FA } from "~/lib/server/auth.actions";

export default function Login2FA() {
  const navigate = useNavigate();

  const [otp, setOtp] = createSignal("");
  const [error, setError] = createSignal("");

  async function verify() {
    setError("");

    if (!otp()) {
      setError("Please enter the generated code");
      return;
    }

    try {
      await verify2FA(otp());
      navigate("/app");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred.",
      );
    }
  }

  return (
    <main class="w-full h-screen flex px-2">
      <div class="m-auto">
        <Card>
          <CardHeader class="space-y-1">
            <CardTitle class="text-2xl">Two-Factor Authentication</CardTitle>
            <CardDescription>
              2FA is enabled for your account, please enter the OTP code from
              your authenticator app
            </CardDescription>
          </CardHeader>

          <CardContent class="grid gap-4">
            <OTPField
              maxLength={6}
              value={otp()}
              onValueChange={setOtp}
              class="mx-auto"
            >
              <OTPFieldInput />
              <OTPFieldGroup>
                <OTPFieldSlot index={0} />
                <OTPFieldSlot index={1} />
                <OTPFieldSlot index={2} />
              </OTPFieldGroup>
              <OTPFieldSeparator />
              <OTPFieldGroup>
                <OTPFieldSlot index={3} />
                <OTPFieldSlot index={4} />
                <OTPFieldSlot index={5} />
              </OTPFieldGroup>
            </OTPField>

            <p class="text-sm text-ctp-red -mb-2">{error()}</p>
          </CardContent>

          <CardFooter>
            <Button class="w-full" onClick={verify}>
              Verify
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
