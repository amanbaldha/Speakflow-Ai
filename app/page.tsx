import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Mic, History } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <Badge variant="secondary" className="mb-6">
          SpeakFlow
        </Badge>

        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Improve your English by simply talking.
        </h1>

        <p className="mt-5 text-lg text-muted-foreground">
          Talk naturally. Get feedback later. Build confidence.
        </p>

        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link href="/setup?mode=casual" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto">
              <MessageCircle className="h-5 w-5" />
              Start Casual Conversation
            </Button>
          </Link>
          <Link href="/setup?mode=interview" className="w-full sm:w-auto">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              <Mic className="h-5 w-5" />
              Start Interview
            </Button>
          </Link>
        </div>

        <div className="mt-4">
          <Button size="sm" variant="ghost" disabled className="text-muted-foreground">
            <History className="h-4 w-4" />
            View Previous Sessions
            <Badge variant="muted" className="ml-1">
              Coming in Phase 4
            </Badge>
          </Button>
        </div>

        <p className="mt-16 max-w-md text-xs text-muted-foreground">
          Requires a working microphone. Works best in Chrome or Edge on a
          MacBook. Your voice is sent to OpenAI for a live response — nothing
          is stored unless you choose to record.
        </p>
      </div>
    </main>
  );
}
