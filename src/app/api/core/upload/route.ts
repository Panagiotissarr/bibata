import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { PrismaClient } from '@prisma/client';

import {
  CORE_SESSION_COOKIE,
  createBuildSessionId,
  HOSTED_PACKAGING_ERROR,
  isHostedPackagingDisabled,
  type CursorBuildPayload,
} from '@utils/local-core';

export const runtime = 'nodejs';

const cookieOptions = {
  httpOnly: true,
  path: '/',
  sameSite: 'lax' as const,
};

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  if (isHostedPackagingDisabled()) {
    return NextResponse.json(
      { id: null, files: [], error: [HOSTED_PACKAGING_ERROR] },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  if (!rawBody) {
    return NextResponse.json(
      { id: null, files: [], error: ['Upload payload is empty.'] },
      { status: 400 },
    );
  }

  let payload: CursorBuildPayload;

  try {
    payload = JSON.parse(rawBody) as CursorBuildPayload;
  } catch {
    return NextResponse.json(
      { id: null, files: [], error: ['Upload payload is not valid JSON.'] },
      { status: 400 },
    );
  }

  const jar = cookies();
  const existing = jar.get(CORE_SESSION_COOKIE)?.value;
  const buildId = existing || createBuildSessionId();

  try {
    await prisma.cursorBuild.upsert({
      where: { id: buildId },
      create: {
        id: buildId,
        name: payload.name,
        platform: payload.platform,
        size: payload.size,
        delay: payload.delay,
        mode: payload.mode,
        frames: payload.frames,
      },
      update: {
        name: payload.name,
        platform: payload.platform,
        size: payload.size,
        delay: payload.delay,
        mode: payload.mode,
        frames: payload.frames,
      },
    });

    const response = NextResponse.json({
      id: buildId,
      files: [payload.name],
      error: null,
    });

    if (!existing) {
      response.cookies.set({
        name: CORE_SESSION_COOKIE,
        value: buildId,
        ...cookieOptions,
      });
    }

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected cursor build error.';

    return NextResponse.json(
      { id: buildId, files: [], error: [message] },
      { status: 500 },
    );
  }
}
