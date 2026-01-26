import React from "react";

export const StitchFooter: React.FC = () => {
  return (
    <footer className="border-t border-muted mt-12 py-6">
      <div className="max-w-7xl mx-auto px-4 text-sm text-muted-foreground">
        © {new Date().getFullYear()} Settler. Open source. Self-hostable.
      </div>
    </footer>
  );
};
