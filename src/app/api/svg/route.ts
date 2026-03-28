import { NextRequest, NextResponse } from 'next/server';

import { TYPES, VERSIONS } from '@root/configs';
import { loadLocalSVGs } from '@utils/svg-local-fallback';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');
  const version = request.nextUrl.searchParams.get('v');

  if (!type) {
    return NextResponse.json(
      { error: "Invalid Request. The 'type' parameter is missing" },
      { status: 400 }
    );
  }

  if (!version || !VERSIONS.includes(version)) {
    return NextResponse.json(
      {
        error: `Sorry, unable to retrieve the v${version} Cursor Bitmaps. Please try again later.`
      },
      { status: 400 }
    );
  }

  if (!TYPES.includes(type)) {
    return NextResponse.json(
      { error: `No cursor bitmaps found for '${type}'` },
      { status: 404 }
    );
  }

  try {
    const data = await loadLocalSVGs(type, version);
    const error =
      !data || data.length === 0
        ? `Oops! It looks like there's a little hiccup fetching the ${type} v${version} SVG nodes right now.`
        : null;

    return NextResponse.json(
      { error, data: data ?? [] },
      { status: error ? 404 : 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Internal Server Error while loading cursor SVGs.'
      },
      { status: 500 }
    );
  }
}
