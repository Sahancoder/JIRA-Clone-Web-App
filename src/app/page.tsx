import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src="/JIRA Logo.png" 
                alt="JIRA Logo" 
                width={40} 
                height={40}
                className="rounded"
              />
              <span className="text-2xl font-bold text-navy">JIRA</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/sign-in"
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-500 hover:text-navy transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors shadow-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-navy mb-6">
            Project Management,{" "}
            <span className="text-primary">Simplified</span>
          </h1>
          <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
            Organize your work, collaborate with your team, and ship faster with
            JIRA's powerful yet intuitive project management platform.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="rounded-lg bg-primary px-8 py-3 text-base font-semibold text-white hover:bg-primary-hover transition-all shadow-lg hover:shadow-xl"
            >
              Start Free Trial
            </Link>
            <Link
              href="/sign-in"
              className="rounded-lg border-2 border-gray-200 bg-white px-8 py-3 text-base font-semibold text-navy hover:border-primary hover:text-primary transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-navy text-center mb-12">
            Everything you need to succeed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-semibold text-navy mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500 mb-4">{feature.description}</p>
                <Link
                  href="/sign-up"
                  className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
                >
                  Explore Feature
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-linear-to-r from-primary to-deep-blue rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to transform your workflow?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of teams already using JIRA to build better products.
            </p>
            <Link
              href="/sign-up"
              className="inline-block rounded-lg bg-white px-8 py-3 text-base font-semibold text-primary hover:bg-gray-50 transition-colors shadow-lg"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src="/JIRA Logo.png" 
                alt="JIRA Logo" 
                width={32} 
                height={32}
                className="rounded"
              />
              <span className="text-lg font-bold text-navy">JIRA</span>
            </div>
            <p className="text-sm text-gray-400">
              © 2025 JIRA. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    title: "Kanban Boards",
    description:
      "Interactive drag-and-drop board with real-time updates, Lexorank positioning, and optimistic UI. Move cards between columns with single-write operations, assign tasks, and collaborate seamlessly across your team.",
  },
  {
    title: "Analytics Dashboard",
    description:
      "Comprehensive metrics and KPIs including task distribution by status, priority breakdowns, workload per assignee, and overdue tracking. Filter by project, date range, and status with efficient server-side aggregations.",
  },
  {
    title: "AI Assistant",
    description:
      "Powered by Google Gemini to auto-generate detailed task descriptions from titles, analyze project status, identify high-risk items, and provide intelligent recommendations. Rate-limited with graceful fallbacks for free-tier safety.",
  },
  {
    title: "Calendar View",
    description:
      "Visualize all deadlines and milestones in month, week, or day views. Filter by project, assignee, and status. Click events to view task details, update due dates via drag-and-drop, with changes reflected across all views.",
  },
  {
    title: "Team Collaboration",
    description:
      "Role-based access control with ADMIN and MEMBER roles. Generate secure invite links with 6-character codes, manage workspace members, assign tasks, @mention teammates in comments, and track activity chronologically.",
  },
  {
    title: "Real-time Updates",
    description:
      "Live synchronization across all views via Appwrite Realtime. See task movements, status changes, new comments, and assignee updates instantly without manual refresh. Graceful offline degradation with connection status indicators.",
  },
];

