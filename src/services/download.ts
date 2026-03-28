import { Platform, Type } from '@prisma/client';

import prisma from './prisma';

export type AddDownloadData = {
  platform: Platform;
  type: Type;
  baseColor: string;
  outlineColor: string;
  watchBGColor: string;
};

export const getIndex = async () => {
  const maxIndex = await prisma.download.findMany();
  return maxIndex?.length || 0;
};

export const addDownload = async (data: AddDownloadData) => {
  const index = (await getIndex()) + 1;
  return await prisma.download.create({ data: { index, ...data } });
};
