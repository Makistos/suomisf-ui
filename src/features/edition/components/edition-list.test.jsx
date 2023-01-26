import React from "react";
import { Router } from "react-router-dom";

import { createMemoryHistory } from "history";

import { EditionList } from "./edition-list";
import { renderWithClient } from "../../../testing";
import { MultiEditions } from "../../../testing";
import { waitFor } from "@testing-library/react";

describe("EditionList", () => {
  it("renders EditionList", async () => {
    const history = createMemoryHistory();
    const result = renderWithClient(
      <Router navigator={history} location="/">
        <EditionList editions={MultiEditions} />
      </Router>
    );
    await waitFor(() => expect(result.getAllByText(/Lydecken, Arvid/i).toString).toBeDefined())
  });
});
