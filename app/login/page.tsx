import { LoginPageClient } from "@/components/auth/LoginPageClient";

export const metadata = {
  title: "Sign in | Travelseed",
  description: "Sign in or create a Travelseed account.",
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

function safeRedirectPath(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/create";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return <LoginPageClient redirectPath={safeRedirectPath(next)} />;
}
