import type { ReactNode } from 'react';

export function Screen({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <section className="py-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {children}
    </section>
  );
}
