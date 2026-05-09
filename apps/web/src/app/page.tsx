import Link from "next/link";
import {
  Clock,
  Users,
  BarChart3,
  Brain,
  Building2,
  Activity,
  ArrowRight,
  Timer,
} from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Smart Time Tracking",
    description:
      "Start and stop timers with one click. Assign time to projects and tasks effortlessly.",
  },
  {
    icon: Users,
    title: "Team Management",
    description:
      "Organize teams, assign leads, and track everyone's contribution in real time.",
  },
  {
    icon: BarChart3,
    title: "Productivity Insights",
    description:
      "Detailed reports on time distribution across projects, teams, and individuals.",
  },
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description:
      "Get intelligent recommendations to improve team productivity and resource allocation.",
  },
  {
    icon: Building2,
    title: "Multi-Organization",
    description:
      "Manage multiple organizations from a single account with role-based access control.",
  },
  {
    icon: Activity,
    title: "Activity Monitoring",
    description:
      "Track app and website usage to understand how time is really being spent.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Navbar */}
      <nav className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Timer className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground">Trackly</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 sm:py-32 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Track Time.{" "}
            <span className="text-primary">Boost Productivity.</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
            The all-in-one platform for tracking employee hours, monitoring
            productivity, and managing teams. Get actionable insights powered by
            AI.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-muted/50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to manage your team
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features designed for modern teams
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <feature.icon className="h-10 w-10 text-primary" />
                <h3 className="mt-4 text-lg font-semibold text-card-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to boost your team&apos;s productivity?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of teams already using Trackly to track time and
            improve efficiency.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            Get Started for Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Trackly
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Trackly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
