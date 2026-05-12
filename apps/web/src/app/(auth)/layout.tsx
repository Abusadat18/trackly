import Link from "next/link";
import { Timer } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-muted/30">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Timer className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold text-foreground">Trackly</span>
      </Link>
      {children}
    </div>
  );
}
