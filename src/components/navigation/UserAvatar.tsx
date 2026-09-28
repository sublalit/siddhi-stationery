'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { getInitials } from '@/lib/getInitials';

export default function UserAvatar({
  name,
  email,
  avatarUrl,
}: {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = getInitials(name, email);
  const showImage = Boolean(avatarUrl) && !imageFailed;

  if (showImage && avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name || email || 'User avatar'}
        width={32}
        height={32}
        className="h-8 w-8 rounded-full object-cover shrink-0 bg-blue-600"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
      {initials}
    </div>
  );
}
