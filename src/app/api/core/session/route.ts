import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  CORE_SESSION_COOKIE,
  createBuildSessionId,
  destroyBuildArtifacts,
  HOSTED_PACKAGING_ERROR,
  isHostedPackagingDisabled
} from '@utils/local-core';

export const runtime = 'nodejs';

const cookieOptions = {
  httpOnly: true,
  path: '/',
  sameSite: 'lax' as const
};

export async function GET() {
  if (isHostedPackagingDisabled()) {
    return NextResponse.json(
      { id: '', error: HOSTED_PACKAGING_ERROR },
      { status: 503 }
    );
  }

  const jar = cookies();
  const existing = jar.get(CORE_SESSION_COOKIE)?.value;
  const id = existing || createBuildSessionId();

  const response = NextResponse.json({ id, role: 'ANONYMOUS' });

  if (!existing) {
    response.cookies.set({
      name: CORE_SESSION_COOKIE,
      value: id,
      ...cookieOptions
    });
  }

  return response;
}

export async function DELETE() {
  const jar = cookies();
  const id = jar.get(CORE_SESSION_COOKIE)?.value ?? null;

  if (id) {
    await destroyBuildArtifacts(id);
  }

  const response = NextResponse.json({ id });
  response.cookies.delete(CORE_SESSION_COOKIE);
  return response;
}
