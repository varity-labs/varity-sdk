'use client';

import { Check } from 'lucide-react';
import { PaymentWidget, PaymentGate } from '@varity-labs/ui-kit';

// Your App ID — set in .env after running: varietykit app deploy --submit-to-store
const APP_ID = process.env.NEXT_PUBLIC_VARITY_APP_ID
  ? parseInt(process.env.NEXT_PUBLIC_VARITY_APP_ID)
  : 1;

const plans = [
  {
    name: 'Free',
    price: 0,
    priceLabel: '$0',
    period: 'forever',
    description: 'Perfect for trying out the platform',
    features: [
      '3 projects',
      '10 tasks per project',
      'Basic analytics',
      'Email support',
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    name: 'Pro',
    price: 1900, // $19.00 in cents
    priceLabel: '$19',
    period: 'per month',
    description: 'Best for growing teams',
    features: [
      'Unlimited projects',
      'Unlimited tasks',
      'Advanced analytics',
      'Priority support',
      'Team collaboration',
      'Custom integrations',
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 9900, // $99.00 in cents
    priceLabel: '$99',
    period: 'per month',
    description: 'For large organizations',
    features: [
      'Everything in Pro',
      'SSO authentication',
      'Audit logs',
      'Dedicated account manager',
      'SLA guarantee',
      'Custom contracts',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
            Pricing
          </p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Choose the plan that works for your team. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border ${
                plan.popular
                  ? 'border-primary-500 shadow-lg shadow-primary-100'
                  : 'border-gray-200'
              } bg-white p-8`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-4 py-1 text-sm font-medium text-white">
                  Most Popular
                </span>
              )}

              <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
              <p className="mt-2 text-sm text-gray-600">{plan.description}</p>

              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900">{plan.priceLabel}</span>
                <span className="text-gray-600">/{plan.period}</span>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary-600 shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {plan.price === 0 ? (
                  <a
                    href="/login"
                    className="block w-full rounded-lg bg-gray-100 py-3 text-center font-medium text-gray-900 hover:bg-gray-200 transition-colors"
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <PaymentWidget
                    appId={APP_ID}
                    price={plan.price}
                    type="subscription"
                    intervalDays={30}
                    onSuccess={(txHash) => {
                      console.log('Payment successful:', txHash);
                      // Redirect to dashboard or show success message
                      window.location.href = '/dashboard';
                    }}
                    onError={(error) => {
                      console.error('Payment failed:', error);
                    }}
                    theme="light"
                  >
                    <button
                      className={`w-full rounded-lg py-3 font-medium transition-colors ${
                        plan.popular
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {plan.cta}
                    </button>
                  </PaymentWidget>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 mx-auto max-w-2xl text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Already subscribed?
          </h3>
          <p className="mt-2 text-gray-600">
            Access your premium features below.
          </p>

          <div className="mt-6">
            <PaymentGate
              appId={APP_ID}
              price={1900}
              fallback={
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-8">
                  <p className="text-gray-600">
                    Subscribe to Pro to unlock premium features.
                  </p>
                </div>
              }
            >
              <div className="rounded-lg border border-green-200 bg-green-50 p-8">
                <p className="text-green-800 font-medium">
                  You have access to all Pro features.
                </p>
              </div>
            </PaymentGate>
          </div>
        </div>
      </div>
    </section>
  );
}
