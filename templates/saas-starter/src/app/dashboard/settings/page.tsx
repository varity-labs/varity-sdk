'use client';

import { PrivyUserProfile, usePrivy } from '@varity-labs/ui-kit';
import { useCurrentUser } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants';

export default function SettingsPage() {
  const { email, name } = useCurrentUser();
  const { logout } = usePrivy();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account and preferences.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Profile</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-500">Name</label>
            <p className="mt-1 text-sm text-gray-900">{name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Email</label>
            <p className="mt-1 text-sm text-gray-900">{email || 'Not set'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Account Settings
        </h2>
        <PrivyUserProfile showLogoutButton={false} />
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="mb-2 text-lg font-semibold text-red-900">Danger Zone</h2>
        <p className="mb-4 text-sm text-red-700">
          Once you sign out, you will need to sign in again to access {APP_NAME}.
        </p>
        <Button variant="danger" onClick={() => logout()}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
