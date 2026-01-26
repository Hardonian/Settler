"use client";
import React from 'react';

export default function AppError({ error }: { error: Error | null }) {
  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '0.5rem' }}>Something went wrong</h2>
      <p>{error?.message ?? 'An unexpected error occurred.'}</p>
      <p>Please reload the page or contact support.</p>
    </div>
  );
}
