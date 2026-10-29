import '@testing-library/jest-dom/vitest';
import { act } from 'react';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Custom-element tests mount React outside RTL's render(); let them use act().
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(async () => {
  cleanup();
  // Removing leftover custom elements unmounts their React roots.
  await act(async () => document.body.replaceChildren());
});
