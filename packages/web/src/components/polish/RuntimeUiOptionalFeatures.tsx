/**
 * RuntimeUiOptionalFeatures
 *
 * Centralized gating for globally-mounted UX widgets that can be noisy during final polish.
 * Controlled via public runtime UI config.
 */

"use client";

import { useRuntimeUiConfig } from "@/lib/runtime-ui-config/client";
import { FloatingHelpButton } from "@/components/support/FloatingHelpButton";
import { Chatbot } from "@/components/chatbot/Chatbot";

export function RuntimeUiOptionalFeatures() {
  const { config } = useRuntimeUiConfig();

  return (
    <>
      {config.features.floatingHelp ? <FloatingHelpButton /> : null}
      {config.features.chatbot ? <Chatbot /> : null}
    </>
  );
}

