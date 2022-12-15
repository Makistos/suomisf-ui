import React from "react";
import { Router } from "react-router-dom";

import { waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";

import { PublisherPage } from "./publisher-page";
import { renderWithClient } from "../../../testing/utils";

describe("PublisherPage", () => {
  it("renders PublisherPage", async () => {
    const history = createMemoryHistory();
    const result = renderWithClient(
      <Router navigator={history} location="/">
        <PublisherPage id={2} />
      </Router>
    );
    await waitFor(() =>
      expect(result.getByText(/Absurdia/i)).toBeInTheDocument()
    );
  });
});
