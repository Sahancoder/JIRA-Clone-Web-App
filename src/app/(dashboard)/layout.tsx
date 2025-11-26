import Link from 'next/link';
import Image from 'next/image';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/JIRA Logo.png"
                  alt="JIRA Logo"
                  width={32}
                  height={32}
                  className="rounded"
                />
                <span className="text-xl font-bold text-navy">JIRA</span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/workspaces"
                  className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                >
                  Workspaces
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="text-sm font-medium text-gray-500 hover:text-navy transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
