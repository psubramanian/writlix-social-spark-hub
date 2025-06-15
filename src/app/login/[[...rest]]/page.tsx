"use client";

import { SignIn } from "@clerk/nextjs";
import { LoginPageHeader } from "@/components/auth/LoginPageHeader";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 selection:bg-purple-500 selection:text-white">
      <div className="text-center mb-10">
        <LoginPageHeader />
        <p className="mt-6 text-lg md:text-xl max-w-2xl">
          Unlock your LinkedIn potential. Sign in to schedule and create engaging content effortlessly with Writlix.
        </p>
      </div>
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-md border border-white/20">
        <SignIn
          path="/login" // This should match NEXT_PUBLIC_CLERK_SIGN_IN_URL
          routing="path"
          signUpUrl="/sign-up" // This should match NEXT_PUBLIC_CLERK_SIGN_UP_URL
          fallbackRedirectUrl="/dashboard" // Replaces afterSignInUrl, should match NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
        />
      </div>
      <p className="mt-10 text-sm text-gray-400">
        Don't have an account? The sign-up option is available within the login form above.
      </p>
    </div>
  );
}
