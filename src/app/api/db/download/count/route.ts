import { NextResponse } from 'next/server';

import { getIndex } from '@services/download';

import { DB_SEEDS, SPONSOR_API_ENDPOINT } from '@root/configs';

import { Goals } from 'bibata/misc';

export async function GET() {
  try {
    const sponsor_data = (await fetch(`${SPONSOR_API_ENDPOINT}?goals=true`)
      .then((r) => r.json())
      .then((json) => json.goals)) as Goals;

    return NextResponse.json({
      total: DB_SEEDS.DOWNLOADS_PER_CENTS(
        sponsor_data.monthlySponsorshipInCents
      ),
      count: await getIndex(),
      role: 'ANONYMOUS'
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ total: 0, count: 0, error: e });
  }
}
