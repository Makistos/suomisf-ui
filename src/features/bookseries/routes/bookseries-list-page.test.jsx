import React from "react";
import { Router } from "react-router-dom";

import { waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";

import { renderWithClient } from "../../../testing";
import { BookseriesListPage } from "./bookseries-list-page";

describe("BookseriesListPage", () => {
    it("renders BookseriesListPage", async () => {
        const history = createMemoryHistory();
        const result = renderWithClient(
            <Router navigator={history} location="/">
                <BookseriesListPage />
            </Router>
        )
        await waitFor(() => expect(result.getByText(/Kirjasarjat/)).toBeDefined())
    })
})
