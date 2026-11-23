'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { OrganizationSettings } from '@/components/OrganizationSettings';
import { MembersPanel } from '@/components/team/MembersPanel';
import { useCurrentLanguage, useI18n } from '@/lib/i18n/useI18n';
import { isOrgRole } from '@/lib/auth/permissions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { toastError } from '@/lib/toast';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') === 'members' ? 'members' : 'general';
  const { t } = useI18n(useCurrentLanguage());
  const setTab = (next: 'general' | 'members') =>
    router.replace(next === 'members' ? `?tab=members` : '?', { scroll: false });

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
          toastError('Failed to load organization');
          return;
        }
        const data = await res.json();
        setOrg(data.organization);
        setMembership(data.membership);
      } catch (err) {
        console.error('Error fetching organization data:', err);
        setError('Error loading organization');
        toastError('Error loading organization');
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
    <div className="min-h-screen bg-base-100">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header with back button */}
        <div className="mb-6">
          <Link
            href={`/dashboard?org=${org.id}`}
            className="text-primary hover:text-primary/80 text-sm font-medium mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold break-words">{org.name}</h1>
          {membership && (
            <p className="text-base-content/70 mt-1">
              {t('organizationSettings.role')}: <span className="font-semibold text-base-content">{isOrgRole(membership.role) ? t(`team.roles.${membership.role}`) : membership.role}</span>
            </p>
          )}
        </div>

        <div role="tablist" className="tabs tabs-bordered mb-6 w-fit">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'general'}
            className={`tab ${tab === 'general' ? 'tab-active' : ''}`}
            onClick={() => setTab('general')}
          >
            {t('team.tabs.general')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'members'}
            className={`tab ${tab === 'members' ? 'tab-active' : ''}`}
            onClick={() => setTab('members')}
          >
            {t('team.tabs.members')}
          </button>
        </div>

        {tab === 'members' ? (
          <MembersPanel org={{ id: org.id, name: org.name }} />
        ) : (
        <div className="space-y-6">
          {/* Organization Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
            </CardHeader>
            <CardContent>
              {isOwner ? (
                <OrganizationSettings
                  organizationId={org.id}
                  organizationName={org.name}
                />
              ) : (
                <div className="text-base-content/70">
                  <p className="mb-2">
                    {t('organizationSettings.name')}: <span className="font-semibold text-base-content">{org.name}</span>
                  </p>
                  <p className="text-sm">{t('team.members.readOnly')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organization Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-base-content/70 mb-1">Name</p>
                  <p className="text-base-content font-medium">{org.name}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70 mb-1">Slug</p>
                  <p className="text-base-content font-medium font-mono break-all">{org.slug}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70 mb-1">{t('organizationSettings.role')}</p>
                  <p className="text-base-content font-medium">{membership && (isOrgRole(membership.role) ? t(`team.roles.${membership.role}`) : membership.role)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
