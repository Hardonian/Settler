import { getExperiment } from "@/app/actions/experiments";
import { notFound } from "next/navigation";
import ExperimentDashboardClient from "./ExperimentDashboardClient";

export default async function ExperimentDashboard({ params }: { params: { id: string } }) {
  const { data: experiment, success } = await getExperiment(params.id);

  if (!success || !experiment) {
    notFound();
  }

  return <ExperimentDashboardClient experiment={experiment} />;
}
