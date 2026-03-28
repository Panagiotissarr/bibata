import { NextRequest, NextResponse } from 'next/server';

import { AddDownloadData, addDownload } from '@services/download';

import { RESPONSES as res } from '@api/config';

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as AddDownloadData;
    await addDownload(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.invalid_request;
  }
}
