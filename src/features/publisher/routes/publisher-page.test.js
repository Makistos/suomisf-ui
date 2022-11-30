import React from "react";
import { QueryClient } from "@tanstack/react-query";

import { screen, waitFor } from "@testing-library/react";

import { PublisherPage } from "./publisher-page";
import { renderWithRouter } from "../../../testing";
import { flushSync } from "react-dom";
import { renderWithClient } from "../../../testing/render-with-client";

const queryClient = new QueryClient();
export function sleep(timeout) {
  return new Promise((resolve, _reject) => {
    setTimeout(resolve, timeout);
  });
}
jest.setTimeout(20000);
describe("PublisherPage", () => {
  it("renders PublisherPage", async () => {
    renderWithClient(queryClient, <PublisherPage id={2} />);
    screen.debug();
    //   <QueryClientProvider client={queryClient}>
    //     renderWithRouter(
    //     <PublisherPage id={2} />
    //     );
    //   </QueryClientProvider>;
    sleep(20000);
    screen.debug();
    // await waitFor(
    //   () => {
    //     //expect(screen.getByTestId("short-name")).toMatch("Atena");
    //     expect(screen.getByText(/Absurdia/i).textContent).toMatch(/Absurdia/),
    //       { timeout: 20000 };
    //     screen.debug();
    //   },
    //   { timeout: 20000 }
    // );
    expect(screen.getByText(/Absurdia/i).textContent).toMatch(/Absurdia/);
  });
});
