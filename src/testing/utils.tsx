import * as React from 'react';
import { Router } from "react-router-dom";
import { render } from "@testing-library/react";
import { createMemoryHistory } from 'history';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
  logger: {
    log: console.log,
    warn: console.warn,
    error: () => { },
  }
})

export function renderWithClient(ui: React.ReactElement) {
  const testQueryClient = createTestQueryClient()
  const { rerender, ...result } = render(
    <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>
  )
  return {
    ...result,
    rerender: (rerenderUi: React.ReactElement) => {
      const history = createMemoryHistory()
      rerender(
        <QueryClientProvider client={testQueryClient}>{rerenderUi}</QueryClientProvider>
      )
    }
  }
}

export function createWrapper() {
  const testQueryClient = createTestQueryClient()
  return ({ children }: { children: React.ReactNode }) => {
    <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
  }
}