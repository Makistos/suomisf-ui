import React from "react";
import { Router } from "react-router-dom";

import { screen } from "@testing-library/react";
import { createMemoryHistory } from "history";

import { EditionSummary } from "./edition-summary";
import { renderWithClient, singleEdition } from "../../../testing";

describe("EditionSummary", () => {
  it("renders valid short story", async () => {
    const history = createMemoryHistory();
    renderWithClient(
      <Router navigator={history} location="/">
        <EditionSummary edition={singleEdition} />
      </Router>
    );
    expect(await screen.getByText(/Kivineitsyt/)).toBeInTheDocument();
  });
});
