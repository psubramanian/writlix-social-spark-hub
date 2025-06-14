import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <SignUp path="/sign-up" routing="path" signInUrl="/login" afterSignUpUrl="/dashboard" />
    </div>
  );
}
