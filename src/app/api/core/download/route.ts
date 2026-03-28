import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import type { Platform } from '@prisma/client';

import {
  CORE_SESSION_COOKIE,
  getPackageContentType,
  HOSTED_PACKAGING_ERROR,
  isHostedPackagingDisabled,
  packageCursorBuild,
  readPackagedCursor
} from '@utils/local-core';

export const runtime = 'nodejs';

const isPlatform = (value: string | null): value is Platform =>
  value === 'png' || value === 'win' || value === 'x11';

export async function GET(request: NextRequest) {
  if (isHostedPackagingDisabled()) {
    return NextResponse.json(
      { id: '', error: [HOSTED_PACKAGING_ERROR] },
      { status: 503 }
    );
  }

  const buildId = cookies().get(CORE_SESSION_COOKIE)?.value;

  if (!buildId) {
    return NextResponse.json(
      { id: '', error: ['No active cursor build session found.'] },
      { status: 400 }
    );
  }

  const platform = request.nextUrl.searchParams.get('platform');
  const name = request.nextUrl.searchParams.get('name');
  const version = request.nextUrl.searchParams.get('v');

  if (!isPlatform(platform) || !name || !version) {
    return NextResponse.json(
      {
        id: buildId,
        error: ['Missing download parameters. Expected platform, name, and version.']
      },
      { status: 400 }
    );
  }

  try {
    const result = await packageCursorBuild({
      buildId,
      platform,
      name,
      version
    });

    if (result.error || !result.path || !result.name) {
      return NextResponse.json(
        { id: buildId, error: result.error ?? ['Cursor package was not created.'] },
        { status: 400 }
      );
    }

    const file = await readPackagedCursor(result.path);

    return new NextResponse(file, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename=${result.name}`,
        'Content-Type': getPackageContentType(result.name)
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected cursor packaging error.';

    return NextResponse.json(
      { id: buildId, error: [message] },
      { status: 500 }
    );
  }
}
