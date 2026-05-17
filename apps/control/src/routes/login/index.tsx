import { useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { TextField, TextFieldInput, TextFieldLabel } from "~/components/ui/text-field";
import { login as serverLogin } from "~/lib/server/auth";

// TODO: homepage
export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");

  async function login() {
    setError("");

    if (!email() || !password()) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      await serverLogin(email(), password());
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    }
  }

  return <main class="w-full h-screen flex px-2">
    <div class="m-auto">
      <Card>
        <CardHeader class="space-y-1">
          <CardTitle class="text-2xl">Log in</CardTitle>
          <CardDescription>Log into your account. Don't have one? <a href="/register">Create an account</a></CardDescription>
        </CardHeader>

        <CardContent class="grid gap-4">
          <TextField class="grid gap-2">
            <TextFieldLabel>Email</TextFieldLabel>
            <TextFieldInput type="email" placeholder="hi@example.com" value={email()} onInput={(e) => setEmail(e.currentTarget.value)} />
          </TextField>
          <TextField class="grid gap-2">
            <TextFieldLabel>Password</TextFieldLabel>
            <TextFieldInput type="password" value={password()} onInput={(e) => setPassword(e.currentTarget.value)} />
          </TextField>

          <p class="text-sm text-ctp-red -mb-2">{error()}</p>
        </CardContent>

        <CardFooter>
          <Button class="w-full" onClick={login}>Log in</Button>
        </CardFooter>
      </Card>
    </div>
  </main>
}
