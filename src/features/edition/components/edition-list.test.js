import React from "react";
import { screen, waitFor } from "@testing-library/react";

import { EditionList } from "./edition-list";
import { renderWithRouter, MultiEditions } from "../../../testing";

jest.setTimeout(10000);
describe("EditionList", () => {
  it("renders EditionList", async () => {
    renderWithRouter(<EditionList editions={MultiEditions} />);
    await waitFor(() => {
      expect(screen.getAllByText(/Lydecken, Arvid/i)).toBeInTheDocument;
      expect(screen.getAllByText(/Tähtimaailmassa seikkailuja/i))
        .toBeInTheDocument;
      expect(screen.getAllByText(/nSF/i)).toBeInTheDocument;
      expect(screen.getAllByText(/Otava/i)).toBeInTheDocument;
    });
  });
});
