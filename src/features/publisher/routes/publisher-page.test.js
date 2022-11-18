import React from "react";
import { unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";
import { render, screen, waitFor } from "@testing-library/react";

it("mocks test", () => {});
// import { PublisherPage } from "./publisher-page";

// jest.setTimeout(10000);
// describe("PublisherPage", () => {
//   it("renders PublisherPage", async () => {
//     render(<PublisherPage id={2} />);
//     screen.debug();
//     await waitFor(() => {
//       expect(
//         screen.getByText(/Haetaan tietoja../i).toMatch("Haetaan tietoja..")
//       );
//     });
//     screen.debug();
//     await waitFor(
//       () => expect(screen.getByText(/Absurdia/)).toMatch(/Absurdia/),
//       { timeout: 5000 }
//     );
//   });
// });
