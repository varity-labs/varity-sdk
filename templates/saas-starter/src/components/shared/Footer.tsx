import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary-600" />
            <span className="font-semibold text-gray-900">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-700 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-gray-700 transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="hover:text-gray-700 transition-colors">
              Pricing
            </a>
            <Link href="/login" className="hover:text-gray-700 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-100 pt-6 text-center text-sm text-gray-400">
          &copy; {year} {APP_NAME}. Built with{' '}
          <a
            href="https://varity.so"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-500 hover:text-primary-600 transition-colors"
          >
            Varity
          </a>
          .
        </div>
      </div>
    </footer>
  );
}
