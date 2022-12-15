import React from "react";
import { Router } from "react-router-dom";

import { createMemoryHistory } from "history";
import { waitFor } from "@testing-library/react";

import { PersonPage } from "./person-page";
import { renderWithClient } from "../../../testing";

describe("PersonPage", () => {
  it("renders PersonPage", async () => {
    const history = createMemoryHistory();
    const result = renderWithClient(
      <Router navigator={history} location="/">
        <PersonPage id={1} />
      </Router>
    );
    await waitFor(() =>
      expect(result.getByText(/Barry Unsworth/i).textContent).toMatch(
        /Barry Unsworth/
      )
    );
  });
});
