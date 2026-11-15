// src/pages/AccountDetails.tsx

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMe } from '@/hooks/auth/useMe';
import { useUpdateProfile } from '@/hooks/auth/useUpdateProfile';
import type { UserResponse } from '@/api/generated/model';

const MAX_FIELD_LENGTH = 255;

const inputClassName = 'h-10 border-gray-200 bg-white focus:border-gray-400 focus:ring-0';

function formatRole(role: string) {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function ProfileForm({ user }: { user: UserResponse }) {
  const [name, setName] = useState(user.name);
  const [surname, setSurname] = useState(user.surname ?? '');
  const [company, setCompany] = useState(user.company ?? '');
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const updateProfile = useUpdateProfile();

  const hasChanges =
    name.trim() !== user.name ||
    surname.trim() !== (user.surname ?? '') ||
    company.trim() !== (user.company ?? '');

  function handleChange(setValue: (value: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      setError('');
      setIsSaved(false);
    };
  }

  function handleReset() {
    setName(user.name);
    setSurname(user.surname ?? '');
    setCompany(user.company ?? '');
    setError('');
    setIsSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSaved(false);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!surname.trim()) {
      setError('Surname is required');
      return;
    }

    try {
      const response = await updateProfile.mutateAsync({
        name: name.trim(),
        surname: surname.trim(),
        company: company.trim() || null,
      });

      if (response.status !== 200) {
        setError('Could not save changes. Check the entered values and try again.');
        return;
      }

      setName(response.data.name);
      setSurname(response.data.surname ?? '');
      setCompany(response.data.company ?? '');
      setIsSaved(true);
    } catch {
      setError('Could not save changes. Try again later.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            maxLength={MAX_FIELD_LENGTH}
            autoComplete="given-name"
            onChange={handleChange(setName)}
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="surname">Surname</Label>
          <Input
            id="surname"
            value={surname}
            maxLength={MAX_FIELD_LENGTH}
            autoComplete="family-name"
            onChange={handleChange(setSurname)}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company (optional)</Label>
        <Input
          id="company"
          value={company}
          maxLength={MAX_FIELD_LENGTH}
          autoComplete="organization"
          onChange={handleChange(setCompany)}
          className={inputClassName}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user.email} disabled readOnly className={inputClassName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            value={formatRole(user.role)}
            disabled
            readOnly
            className={inputClassName}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
        <Button
          type="submit"
          disabled={!hasChanges || updateProfile.isPending}
          className="h-10 w-full cursor-pointer rounded-lg bg-[#171717] px-4 text-sm font-medium text-white hover:bg-[#2A2A2A] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[140px]"
        >
          {updateProfile.isPending ? 'Saving...' : 'Save changes'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges || updateProfile.isPending}
          className="h-10 w-full cursor-pointer rounded-lg px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Cancel
        </Button>

        <div aria-live="polite" className="text-sm">
          {error && <p className="text-red-500">{error}</p>}
          {isSaved && !error && <p className="text-green-700">Changes saved.</p>}
        </div>
      </div>
    </form>
  );
}

export default function AccountDetails() {
  const { data: user, isLoading } = useMe();

  return (
    <div className="mx-auto w-full max-w-[760px] sm:px-2 lg:px-4">
      <section
        aria-labelledby="page-title"
        className="rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] px-3 py-4 shadow-sm sm:px-8 sm:py-7"
      >
        <h1
          id="page-title"
          className="text-center text-2xl font-semibold leading-tight tracking-tight text-[#0A0A0A] sm:text-4xl"
        >
          Account details
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Update your name, surname and company.
        </p>

        <div className="mt-5 rounded-lg border border-[#E5E5E5] bg-white p-4 sm:p-6">
          {isLoading && <p className="text-sm text-gray-500">Loading...</p>}
          {!isLoading && !user && (
            <p className="text-sm text-red-500">Could not load account details.</p>
          )}
          {user && <ProfileForm key={user.id} user={user} />}
        </div>
      </section>
    </div>
  );
}
