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
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from "~/components/ui/text-field";
import { register as serverRegister } from "~/lib/server/auth.actions";

export default function Login() {
  const navigate = useNavigate();

  const [displayName, setDisplayName] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [confirmPassword, setConfirmPassword] = createSignal("");

  const [error, setError] = createSignal("");

  async function register() {
    setError("");

    if (!email() || !password() || !confirmPassword()) {
      setError("Please fill in all fields.");
      return;
    }

    if (password() !== confirmPassword()) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await serverRegister({
        displayName: displayName(),
        email: email(),
        password: password(),
      });
      navigate("/app");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred.",
      );
    }
  }

  return (
    <main class="w-full h-screen flex">
      <div class="m-auto">
        <Card>
          <CardHeader class="space-y-1">
            <CardTitle class="text-2xl">Create an account</CardTitle>
            <CardDescription>
              Enter your display name, email and password to register. Already
              have an account? <a href="/login">Log in</a>
            </CardDescription>
          </CardHeader>

          <CardContent class="grid gap-4">
            <TextField class="grid gap-2">
              <TextFieldLabel>Display Name</TextFieldLabel>
              <TextFieldInput
                placeholder="John Doe"
                value={displayName()}
                onInput={(e) => setDisplayName(e.currentTarget.value)}
              />
            </TextField>

            <TextField class="grid gap-2">
              <TextFieldLabel>Email</TextFieldLabel>
              <TextFieldInput
                type="email"
                placeholder="hi@example.com"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
              />
            </TextField>
            <TextField class="grid gap-2">
              <TextFieldLabel>Password</TextFieldLabel>
              <TextFieldInput
                type="password"
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
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
            <Button class="w-full" onClick={register}>
              Register
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
