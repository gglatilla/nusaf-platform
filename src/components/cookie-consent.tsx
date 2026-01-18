"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { Cookie } from "lucide-react";

const COOKIE_CONSENT_KEY = "nusaf_cookie_consent";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Show banner after a short delay to avoid layout shift
      const timer = setTimeout(() => setShowBanner(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Cookie className="h-5 w-5 shrink-0 text-orange-500" />
          <span>
            We use cookies for authentication and to remember your preferences.
            See our{" "}
            <Link
              href="/privacy-policy"
              className="text-primary hover:underline font-medium"
            >
              Privacy Policy
            </Link>{" "}
            for details.
          </span>
        </div>
        <Button onClick={handleAccept} className="shrink-0">
          Accept &amp; Continue
        </Button>
      </div>
    </div>
  );
}
