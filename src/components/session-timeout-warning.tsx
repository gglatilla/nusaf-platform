"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui";

interface SessionTimeoutWarningProps {
  // Time in minutes before session expires to show warning
  warningMinutes?: number;
  // Total session duration in minutes (for display purposes)
  sessionDurationMinutes?: number;
}

export function SessionTimeoutWarning({
  warningMinutes = 5,
  sessionDurationMinutes = 60,
}: SessionTimeoutWarningProps) {
  const { data: session, update } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Track user activity
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Extend session by triggering a session update
  const extendSession = useCallback(async () => {
    await update();
    setShowWarning(false);
    setLastActivity(Date.now());
  }, [update]);

  // Handle logout
  const handleLogout = useCallback(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  // Set up activity listeners
  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart"];

    events.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [updateActivity]);

  // Check for timeout
  useEffect(() => {
    if (!session) return;

    const checkTimeout = () => {
      const now = Date.now();
      const idleTime = now - lastActivity;
      const idleMinutes = idleTime / (1000 * 60);
      const timeUntilWarning = sessionDurationMinutes - warningMinutes;

      if (idleMinutes >= sessionDurationMinutes) {
        // Session expired, log out
        handleLogout();
      } else if (idleMinutes >= timeUntilWarning) {
        // Show warning
        setShowWarning(true);
        setRemainingTime(Math.ceil(sessionDurationMinutes - idleMinutes));
      } else {
        setShowWarning(false);
      }
    };

    const interval = setInterval(checkTimeout, 10000); // Check every 10 seconds
    checkTimeout(); // Initial check

    return () => clearInterval(interval);
  }, [
    session,
    lastActivity,
    warningMinutes,
    sessionDurationMinutes,
    handleLogout,
  ]);

  // Update remaining time display
  useEffect(() => {
    if (!showWarning) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivity;
      const idleMinutes = idleTime / (1000 * 60);
      const remaining = Math.ceil(sessionDurationMinutes - idleMinutes);

      if (remaining <= 0) {
        handleLogout();
      } else {
        setRemainingTime(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning, lastActivity, sessionDurationMinutes, handleLogout]);

  if (!showWarning || !session) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Session Expiring Soon
        </h2>
        <p className="text-muted-foreground mb-4">
          Your session will expire in{" "}
          <span className="font-semibold text-orange-600">
            {remainingTime} minute{remainingTime !== 1 ? "s" : ""}
          </span>{" "}
          due to inactivity.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Would you like to continue your session or log out?
        </p>
        <div className="flex gap-3">
          <Button onClick={extendSession} className="flex-1">
            Continue Session
          </Button>
          <Button onClick={handleLogout} variant="outline" className="flex-1">
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}
