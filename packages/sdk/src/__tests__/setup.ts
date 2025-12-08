import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// Setup MSW server for Node.js environment
export const server = setupServer(...handlers);

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset any request handlers that are declared as a part of our tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());
