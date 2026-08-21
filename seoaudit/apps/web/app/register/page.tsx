import { RegisterForm } from '@/components/RegisterForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a new SEO Audit account',
};

export default function RegisterPage() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-zinc-900 dark:text-white">
          Sign Up
        </h1>
        <RegisterForm />
      </div>
    </div>
  );
}
