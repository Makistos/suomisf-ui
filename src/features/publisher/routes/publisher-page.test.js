import React from "react";
import { unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";
import { screen, waitFor } from "@testing-library/react";

//it("mocks test", () => {});
import { PublisherPage } from "./publisher-page";
import { renderWithRouter } from "../../../testing";

jest.setTimeout(10000);
describe("PublisherPage", () => {
  it("renders PublisherPage", async () => {
    renderWithRouter(<PublisherPage id={2} />);
    await waitFor(() => {
      expect(screen.getByText(/Haetaan tietoja../i).textContent).toBe(
        "Haetaan tietoja.."
      );
    });
    await waitFor(
      () =>
        expect(screen.getByText(/Absurdia/i).textContent).toMatch(/Absurdia/),
      { timeout: 5000 }
    );
    //screen.debug();
  });
});
