import { useNavigate } from "@solidjs/router";

export default function Home() {
  const navigate = useNavigate();
  navigate("/dashboard");

  return (
    <main>
      <p class="text-4xl">hello, world</p>
    </main>
  );
}
