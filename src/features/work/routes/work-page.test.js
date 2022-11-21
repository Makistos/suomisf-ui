import React from "react";
import { screen, waitFor } from "@testing-library/react";

import { WorkPage } from "../../work";
import { renderWithRouter } from "../../../testing";

jest.setTimeout(10000);
describe("PublisherPage", () => {
  it("renders PublisherPage", async () => {
    renderWithRouter(<WorkPage id={1} />);
    await waitFor(
      () =>
        expect(screen.getByText(/Kivineitsyt/i).textContent).toMatch(
          /Kivineitsyt/
        ),
      { timeout: 5000 }
    );
  });
});
