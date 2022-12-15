import React from "react";
import { Router } from "react-router-dom";

import { createMemoryHistory } from "history";

import { WorkPage } from "../../work";
import { renderWithClient } from "../../../testing";

describe("PublisherPage", () => {
  it("renders PublisherPage", async () => {
    const history = createMemoryHistory();
    const result = renderWithClient(
      <Router navigator={history} location="/">
        <WorkPage id={1} />
      </Router>
    );
    expect(await result.findByText(/Kivineitsyt/)).toBeInTheDocument();
  });
});
