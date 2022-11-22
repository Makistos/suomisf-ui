import React from "react";
import { screen, waitFor, render, cleanup } from "@testing-library/react";

import { BookseriesPage } from "./bookseries-page";
import { renderWithRouter } from "../../../testing";

afterEach(cleanup);

const { getAllByText } = renderWithRouter(<BookseriesPage id={"1"} />);

describe("BookseriesPage", () => {
  it("renders BookseriesPage", async () => {
    await waitFor(() => {
      expect(getAllByText(/5. aalto/)[0].textContent).toMatch(/5. aalto/);
    });
  });
});
