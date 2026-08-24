'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

interface CreateOrganizationFormProps {
  userId: string;
}

export function CreateOrganizationForm({ userId }: CreateOrganizationFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Organization name is required');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create organization');
        return;
      }

      setName('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Organization name"
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          {isLoading ? 'Creating...' : 'Create'}
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
    </form>
  );
}
