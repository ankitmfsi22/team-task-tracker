import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

// Default: the API is up.
export const handlers = [http.get('*/api/health', () => HttpResponse.json({ status: 'ok' }))];

export const server = setupServer(...handlers);
