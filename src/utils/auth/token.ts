import { v4 } from 'uuid';

import type { AuthToken } from 'bibata/core-api/types';

export const genAccessToken = () => {
  const token_id = v4();

  return {
    id: token_id,
    role: 'ANONYMOUS',
    token: token_id
  } as AuthToken;
};
