import React from "react";
import { render, screen } from "@testing-library/react";
import { OtherEdition } from "./other-edition";

import { renderWithClient } from "../../../testing";
import { singleEdition } from "../../../testing";

it("renders valid edition with showFirst == true", () => {
  renderWithClient(<OtherEdition edition={singleEdition} showFirst={true} />);
  expect(screen.getByText(/1.painos/)).toBeInTheDocument();
  expect(screen.getByText(/WSOY/)).toBeInTheDocument();
  expect(screen.getByText(/1986/)).toBeInTheDocument();
});
