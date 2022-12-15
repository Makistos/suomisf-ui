import React from "react";
import { Router } from "react-router-dom";

import { waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";

import { BookseriesPage } from "./bookseries-page";
import { renderWithClient } from "../../../testing";

describe("BookseriesPage", () => {
  it("renders BookseriesPage", async () => {
    const history = createMemoryHistory();
    const result = renderWithClient(
      <Router navigator={history} location="/">
        <BookseriesPage id={1} />
      </Router>
    )
    await waitFor(() => expect(result.getAllByText(/5. aalto/)[0].textContent).toBeDefined());
  });
});
