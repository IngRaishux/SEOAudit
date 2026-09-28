'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { OrganizationSettings } from '@/components/OrganizationSettings';
import { DeleteOrganizationDialog } from '@/components/DeleteOrganizationDialog';

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface Membership {
  _id: string;
  organizationId: string;
  role: string;
}

function OrganizationSettingsContent() {
  const params = useParams();
  const orgId = params.orgId as string;

  const [org, setOrg] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/organizations/${orgId}/info`);
        if (!res.ok) {
          setError('Failed to load organization');
          return;
        }
        const data = await res.json();
        setOrg(data.organization);
        setMembership(data.membership);
      } catch (err) {
        console.error('Error fetching organization data:', err);
        setError('Error loading organization');
      } finally {
        setLoading(false);
      }
    };

    if (orgId) {
      fetchData();
    }
  }, [orgId]);

  const isOwner = membership?.role === 'owner';

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
        <div className="text-red-600">{error || 'Error loading organization'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header with back button */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 text-sm font-medium mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold">{org.name}</h1>
          {membership && (
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Role: <span className="capitalize font-semibold">{membership.role}</span>
            </p>
          )}
        </div>

        {/* Organization Settings */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 mb-6">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Organization Settings</h2>
          </div>

          <div className="p-6">
            {isOwner ? (
              <OrganizationSettings
                organizationId={org.id}
                organizationName={org.name}
              />
            ) : (
              <div className="text-zinc-600 dark:text-zinc-400">
                <p className="mb-2">
                  Organization Name: <span className="font-semibold text-zinc-900 dark:text-white">{org.name}</span>
                </p>
                <p className="text-sm">Only the organization owner can change the organization name.</p>
              </div>
            )}
          </div>
        </div>

        {/* Organization Information */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 mb-6">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Organization Information</h2>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Name</p>
                <p className="text-zinc-900 dark:text-white font-medium">{org.name}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Slug</p>
                <p className="text-zinc-900 dark:text-white font-medium font-mono">{org.slug}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Your Role</p>
                <p className="text-zinc-900 dark:text-white font-medium capitalize">{membership?.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        {isOwner && (
          <div className="bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
            <div className="p-6 border-b border-red-200 dark:border-red-900">
              <h2 className="text-xl font-semibold text-red-800 dark:text-red-200">
                ⚠️ Danger Zone
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                    Delete Organization
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-300 mb-4">
                    Once you delete an organization, there is no going back. Please be certain.
                  </p>
                  <DeleteOrganizationDialog
                    organizationId={org.id}
                    organizationName={org.name}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrganizationSettingsPage() {
  return (
    <Suspense fallback={<div className="text-zinc-600 dark:text-zinc-400 p-8">Loading...</div>}>
      <OrganizationSettingsContent />
    </Suspense>
  );
}
