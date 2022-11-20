import React from "react";
import { screen, waitFor } from "@testing-library/react";

import { PersonPage } from "./person-page";
import { renderWithRouter } from "../../../testing";

jest.setTimeout(10000);
describe("PersonPage", () => {
  it("renders PersonPage", async () => {
    renderWithRouter(<PersonPage id={1} />);
    await waitFor(
      () =>
        expect(screen.getByText(/Barry Unsworth/i).textContent).toMatch(
          /Barry Unsworth/
        ),
      { timeout: 5000 }
    );
  });
});
