import React from "react";
import { Router } from "react-router-dom";

import { waitFor } from "@testing-library/react";
import { createMemoryHistory } from "history";

import { renderWithClient } from "../../../testing/utils";
import { BookSeriesList } from "./bookseries-list";
import { bookseriesWorks } from "../../../testing/bookseries";

describe("BooSeriesList", () => {
    it("renders valid bookseries list", async () => {
        const result = renderWithClient(
            <BookSeriesList works={bookseriesWorks} />
        )
        await waitFor(() => expect(result.getByText(/Merihevoset/)).toBeInTheDocument())
    })
})