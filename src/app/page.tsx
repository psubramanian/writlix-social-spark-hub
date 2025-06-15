"use client";

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-6">
          <span className="text-purple-300">W</span>ritlix
        </h1>
        <p className="text-xl mb-8">
          Unlock your LinkedIn potential. Create engaging content effortlessly.
        </p>
        <div>
          You should be redirected to login automatically...
        </div>
      </div>
    </div>
  );
}
