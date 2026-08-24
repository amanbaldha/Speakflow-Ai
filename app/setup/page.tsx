import { Suspense } from "react";
import { SetupClient } from "./SetupClient";

export default function SetupPage() {
  return (
    <Suspense fallback={null}>
      <SetupClient />
    </Suspense>
  );
}
