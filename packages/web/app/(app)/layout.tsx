import type { ReactNode } from 'react';
import { StitchFooter } from '../../../../stitch_export/components/Footer';
import { StitchHeader } from '../../../../stitch_export/components/Header';

// App shell layout for authenticated routes, skinned with Stitch UI.
export const metadata = {
  title: 'Settler App',
  description: 'Settler app shell (authenticated) with Stitch UI facelift',
};

export default function AppLayout({
  children,
}: {
  readonly children: ReactNode;
}): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col">
      <StitchHeader />
      <main className="flex-1 w-full mx-auto px-4 py-6">{children}</main>
      <StitchFooter />
    </div>
  );
}
