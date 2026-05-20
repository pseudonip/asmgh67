import { useNavigate } from "@solidjs/router";

// TODO: homepage
export default function Home() {
  const navigate = useNavigate();
  navigate("/login");

  return;
}
