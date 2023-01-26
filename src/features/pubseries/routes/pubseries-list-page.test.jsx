import React from "react";
import { Router } from "react-router-dom";

import { waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";

import { renderWithClient } from "../../../testing";
import { PubseriesListPage } from "./pubseries-list-page";

describe("PubseriesListPage", () => {
    it("renders PubserisListPage", async () => {
        const history = createMemoryHistory();
        const result = renderWithClient(
            <Router navigator={history} location="/">
                <PubseriesListPage />
            </Router>
        )
        await waitFor(() => expect(result.getByText(/Kustantajien sarjat/)).toBeDefined())
    })
})