import React from "react";
import { render, screen } from "@testing-library/react";
import { EditionSummary } from "./edition-summary";

import { renderWithRouter, singleEdition } from "../../../testing";

it("renders valid short story", () => {
  renderWithRouter(<EditionSummary edition={singleEdition} />);
  expect(screen.getByText(/Kivineitsyt/)).toBeInTheDocument();
});
