import React from "react";
import { Router } from "react-router-dom";

import { screen, waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";

import { EditionSummary } from "./edition-summary";
import { renderWithClient, singleEdition } from "../../../testing";

describe("EditionSummary", () => {
  it("renders valid short story", async () => {
    const history = createMemoryHistory();
    const result = renderWithClient(
      <Router navigator={history} location="/">
        <EditionSummary edition={singleEdition} />
      </Router>
    );
    await waitFor(() =>
      expect(result.getByText(/Kivineitsyt/)).toBeInTheDocument()
    );
  });
});
