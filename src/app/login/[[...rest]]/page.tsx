"use client";

import { SignIn } from "@clerk/nextjs";
import { LoginPageHeader } from "@/components/auth/LoginPageHeader";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white selection:bg-purple-500 selection:text-white">
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center mb-10">
          <LoginPageHeader />
          <p className="mt-6 text-lg md:text-xl max-w-2xl mx-auto">
            Unlock your LinkedIn potential. Sign in to schedule and create engaging content effortlessly with Writlix.
          </p>
        </div>
        
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl rounded-xl p-6">
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent border-0 shadow-none p-0",
                  headerTitle: "text-white text-2xl font-bold",
                  headerSubtitle: "text-gray-300",
                  socialButtonsBlockButton: "bg-white/20 border-white/30 text-white hover:bg-white/30 transition-colors",
                  socialButtonsBlockButtonText: "text-white font-medium",
                  formButtonPrimary: "bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors",
                  formFieldInput: "bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400",
                  formFieldLabel: "text-gray-300 font-medium",
                  identityPreviewText: "text-gray-300",
                  identityPreviewEditButton: "text-purple-400",
                  footerActionText: "text-gray-400",
                  footerActionLink: "text-purple-400 hover:text-purple-300",
                  dividerLine: "bg-white/20",
                  dividerText: "text-gray-400",
                  alertText: "text-red-300",
                  formFieldSuccessText: "text-green-300",
                  formFieldErrorText: "text-red-300",
                  formFieldHintText: "text-gray-400",
                },
              }}
            />
          </div>
        </div>
        
        <p className="mt-8 text-sm text-gray-400 text-center">
          Don't have an account? The sign-up option is available within the login form above.
        </p>
      </div>
    </div>
  );
}
