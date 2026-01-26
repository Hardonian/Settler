import React from "react";

export const HeroSection: React.FC = () => {
  return (
    <section className="my-12">
      <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
        Reconciliation for teams that own their data
      </h1>
      <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
        Settler is an open-source reconciliation engine. Run locally for free, self-host in your
        infrastructure, or scale to cloud when ready.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <a href="/docs/quickstart" className="btn btn-primary">
          Run locally
        </a>
        <a href="https://github.com/settler-dev/settler" className="btn btn-secondary">
          Star on GitHub
        </a>
        <a href="/docs" className="btn">
          View docs
        </a>
      </div>
    </section>
  );
};
