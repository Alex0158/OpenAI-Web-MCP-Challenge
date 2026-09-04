import { redirect } from "next/navigation";

type ConsentPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function ConsentPage({ searchParams }: ConsentPageProps) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const receiverUrl = new URL(
    "/consent",
    process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000"
  );
  if (token) receiverUrl.searchParams.set("token", token);
  redirect(receiverUrl.toString());
}
