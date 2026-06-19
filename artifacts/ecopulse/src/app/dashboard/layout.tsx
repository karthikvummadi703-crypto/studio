

import React from 'react';

/**
 * Dashboard Layout is now handled by the global RootLayout GlobalNavigation wrapper.
 * This file is kept to maintain the directory structure.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-full">
      {children}
    </div>
  );
}
