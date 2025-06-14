import { SignIn } from "@clerk/clerk-react";

export default function LoginPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <SignIn path="/login" routing="path" signUpUrl="/sign-up" afterSignInUrl="/dashboard" />
    </div>
  );
}
