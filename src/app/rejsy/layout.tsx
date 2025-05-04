import Link from 'next/link';

export default function CruisesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section>
      <nav className="border-b">
        <div className="container mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-lg font-bold">
              Cybernetyczny Ochmistrz
            </Link>
            <div className="flex gap-6">
              <Link href="/przepisy" className="hover:text-blue-600">
                Przepisy
              </Link>
              <Link href="/rejsy" className="font-medium text-blue-600">
                Rejsy
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </section>
  );
} 