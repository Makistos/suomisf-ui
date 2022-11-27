import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { screen, waitFor } from "@testing-library/react";

import { PublisherPage } from "./publisher-page";
import { renderWithRouter } from "../../../testing";
import { flushSync } from "react-dom";

const queryClient = new QueryClient();

jest.setTimeout(20000);

describe("PublisherPage", () => {
  it("renders PublisherPage", async () => {
    <QueryClientProvider client={queryClient}>
      renderWithRouter(
      <PublisherPage id={2} />
      );
    </QueryClientProvider>;
    await waitFor(
      () => {
        //expect(screen.getByTestId("short-name")).toMatch("Atena");
        expect(screen.getByText(/Absurdia/i).textContent).toMatch(/Absurdia/),
          { timeout: 20000 };
        screen.debug();
      },
      { timeout: 20000 }
    );
  });
});
