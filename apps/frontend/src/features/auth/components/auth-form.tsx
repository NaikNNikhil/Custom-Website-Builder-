"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type AuthFormProps = {
  mode: "login" | "signup";
  onSubmit: (email: string, password: string, confirmPassword?: string) => Promise<void>;
  error?: string | null;
  isSubmitting?: boolean;
};

export function AuthForm({ mode, onSubmit, error, isSubmitting = false }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError("Email is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLocalError("Enter a valid email address");
      return;
    }

    if (!password) {
      setLocalError("Password is required");
      return;
    }

    if (isSignup && password.length < 8) {
      setLocalError("Password must be at least 8 characters long");
      return;
    }

    if (isSignup && !/[A-Z]/.test(password)) {
      setLocalError("Password must contain at least 1 uppercase letter");
      return;
    }

    if (isSignup && !/[a-z]/.test(password)) {
      setLocalError("Password must contain at least 1 lowercase letter");
      return;
    }

    if (isSignup && !/\d/.test(password)) {
      setLocalError("Password must contain at least 1 number");
      return;
    }

    if (isSignup && confirmPassword !== password) {
      setLocalError("Passwords do not match");
      return;
    }

    await onSubmit(email, password, confirmPassword);
  };

  const isSignup = mode === "signup";

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{isSignup ? "Create your account" : "Welcome back"}</CardTitle>
        <CardDescription>
          {isSignup ? "Set up your account to continue" : "Sign in to access your dashboard"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" noValidate onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>

          {isSignup ? (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm password"
              />
            </div>
          ) : null}

          {isSignup ? (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>At least 8 characters</p>
              <p>1 uppercase letter</p>
              <p>1 lowercase letter</p>
              <p>1 number</p>
            </div>
          ) : null}

          {(error || localError) && (
            <p className="text-sm text-destructive">{localError ?? error}</p>
          )}

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (isSignup ? "Creating account..." : "Signing in...") : isSignup ? "Create account" : "Login"}
          </Button>
        </form>

        <Separator className="my-4" />

        <div className="text-sm text-center text-muted-foreground">
          {isSignup ? "Already have an account? " : "Need an account? "}
          <a href={isSignup ? "/login" : "/signup"} className="font-medium text-foreground underline">
            {isSignup ? "Login" : "Sign up"}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
