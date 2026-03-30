import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/console/exceptions/${id}`);
}
