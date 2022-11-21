import React from "react";
import { render, screen } from "@testing-library/react";
import { EditionDetails } from "./edition-details";

import { renderWithRouter, singleEdition } from "../../../testing";

it("renders valid short story", () => {
  renderWithRouter(<EditionDetails edition={singleEdition} />);
  expect(screen.getByText(/Aira Buffa/)).toBeInTheDocument();
});
