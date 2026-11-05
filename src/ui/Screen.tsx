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
      <h1 className="text-3xl font-black tracking-tight">{title}</h1>
      {children}
    </section>
  );
}
