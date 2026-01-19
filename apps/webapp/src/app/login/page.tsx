"use client";

import { useState, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getRedirectUrl } from "@nusaf/auth";
import {
  Button,
  Input,
  PasswordInput,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@nusaf/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const { update: updateSession } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        rememberMe: rememberMe.toString(),
        redirect: false,
      });

      if (result?.error) {
        // Display appropriate error message
        setError(getErrorMessage(result.error));
      } else {
        // Get fresh session to determine user type
        const session = await updateSession();

        // Check if user must change password
        if (session?.user?.mustChangePassword) {
          router.push("/change-password");
        } else if (callbackUrl) {
          // Use callback URL if provided
          router.push(callbackUrl);
        } else {
          // Redirect based on user type
          const redirectUrl = getRedirectUrl(session?.user?.userType || "customer");
          router.push(redirectUrl);
        }
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex flex-col items-center mb-4">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            NUSAF
          </Link>
          <span className="text-sm text-muted-foreground">
            Dynamic Technologies
          </span>
        </div>
        <CardTitle className="text-2xl text-center">Sign In</CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">
                Remember me
              </span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-muted-foreground">
                or
              </span>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/request-account"
              className="text-primary hover:underline font-medium"
            >
              Request access
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

function LoginFormSkeleton() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex flex-col items-center mb-4">
          <div className="text-2xl font-bold text-gray-900">NUSAF</div>
          <span className="text-sm text-muted-foreground">
            Dynamic Technologies
          </span>
        </div>
        <CardTitle className="text-2xl text-center">Sign In</CardTitle>
        <CardDescription className="text-center">
          Loading...
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

function getErrorMessage(error: string): string {
  // Map error codes to user-friendly messages
  switch (error) {
    case "ACCOUNT_PENDING":
      return "Your account is pending approval. We'll email you when it's ready.";
    case "ACCOUNT_DISABLED":
      return "Your account has been disabled. Please contact support.";
    case "ACCOUNT_LOCKED":
      return "Account temporarily locked. Try again in 15 minutes or reset your password.";
    case "COMPANY_INACTIVE":
      return "Your company account is inactive. Please contact your administrator.";
    case "MUST_CHANGE_PASSWORD":
      // This shouldn't show as an error - should redirect
      return "Please change your password.";
    default:
      return "Invalid email or password";
  }
}
