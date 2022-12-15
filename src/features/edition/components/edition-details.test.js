import React from "react";
import { Router } from "react-router-dom";

import { createMemoryHistory } from "history";

import { EditionDetails } from "./edition-details";
import { renderWithClient } from "../../../testing/utils";
import { singleEdition } from "../../../testing";

describe("edition-details", () => {
  it("renders valid short story", async () => {
    const history = createMemoryHistory();
    const result = renderWithClient(
      <Router navigator={history} location="/">
        <EditionDetails edition={singleEdition} />
      </Router>
    );
    expect(await result.getByText(/Aira Buffa/)).toBeInTheDocument();
  });
});
