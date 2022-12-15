import React from "react";
import { Router } from "react-router-dom";

import { screen } from "@testing-library/react";
import { createMemoryHistory } from "history";

import { EditionList } from "./edition-list";
import { renderWithClient } from "../../../testing";
import { MultiEditions } from "../../../testing";

describe("EditionList", () => {
  it("renders EditionList", async () => {
    const history = createMemoryHistory();
    const result = renderWithClient(
      <Router navigator={history} location="/">
        <EditionList editions={MultiEditions} />
      </Router>
    );
    expect(await result.getAllByText(/Lydecken, Arvid/i).toString).toBeDefined();
  });
});
