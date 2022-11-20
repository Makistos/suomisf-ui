import React from "react";
import { render, screen } from "@testing-library/react";
import { ShortSummary } from "./short-summary";

import { singleShort } from "../../../testing/shorts";

it("renders empty short summary", () => {
  render(<ShortSummary />);
  expect(screen.getByText(/Haetaan tietoja../)).toBeInTheDocument();
});

it("renders valid short story", () => {
  render(<ShortSummary short={singleShort} skipAuthors={true} />);
  expect(screen.getByText(/Robottiunta/)).toBeInTheDocument();
});
