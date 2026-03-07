import { ProofExplorer } from "@/components/proof/ProofExplorer";

export const metadata = {
  title: "Proof Explorer",
  description: "Navigate trust graphs for execution proofs and artifact lineage.",
};

export default function ProofExplorerPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <ProofExplorer />
    </main>
  );
}
