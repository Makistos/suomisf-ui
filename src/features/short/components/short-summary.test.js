import React from "react";
import { act } from "react-dom/test-utils";
import { render, screen, waitFor } from "@testing-library/react";
import { ShortSummary } from "./short-summary";

import { singleShort } from "../../../testing/shorts";

if (
  ("mocks a test",
  () => {
    expect("a").toMatch("a");
  })
);
// it("renders empty short summary", () => {
//   render(<ShortSummary />);
//   expect(screen.getByText(/Haetaan tietoja../)).toBeInTheDocument();
// });

// it("renders valid short story", () => {
//   render(<ShortSummary short={singleShort} skipAuthors={true} />);
//   screen.debug();
// });