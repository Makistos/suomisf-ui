import React from "react";
import { act } from "react-dom/test-utils";
import { render, screen, waitFor } from "@testing-library/react";
import { ShortSummary } from "./short-summary";

import { singleShort } from "../../../testing/shorts";
import { renderWithRouter } from "../../../testing";

it("renders empty short summary", () => {
  render(<ShortSummary />);
  expect(screen.getByText(/Haetaan tietoja../)).toBeInTheDocument();
});

it("renders valid short story", () => {
  renderWithRouter(<ShortSummary short={singleShort} skipAuthors={true} />);
  expect(screen.getByText(/Robottiunta/)).toBeInTheDocument();
});
