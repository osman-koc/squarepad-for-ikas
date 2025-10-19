'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Loading from '@/components/Loading';
import { TokenHelpers } from '@/helpers/token-helpers';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(searchParams.toString());
      const hasTokenParams = params.has('token') && params.has('redirectUrl') && params.has('authorizedAppId');

      if (hasTokenParams) {
        await TokenHelpers.setToken(router, params);
        return;
      }

      if (params.has('code')) {
        window.location.replace(`/api/oauth/callback/ikas?${params.toString()}`);
        return;
      }

      try {
        router.push('/authorize-store');
      } catch {
        window.location.replace('/authorize-store');
      }
    })();
  }, [router, searchParams]);

  return <Loading />;
}

export default function AdminCallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
