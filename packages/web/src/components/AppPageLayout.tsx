"use client";

import React from "react";

interface AppPageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const AppPageLayout: React.FC<AppPageLayoutProps> = ({ title, description, children }) => {
  return (
    <div className="min-h-screen bg-bg text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-12 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{title}</h1>
          {description && <p className="text-muted text-lg max-w-3xl">{description}</p>}
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
};

export default AppPageLayout;
