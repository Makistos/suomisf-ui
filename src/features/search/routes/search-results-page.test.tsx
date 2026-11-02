// @vitest-environment jsdom
import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { byText, click, waitFor } from "../../../test-utils/render";

type ApiCall = (url: string, ...rest: any[]) => Promise<any>;
const api = vi.hoisted(() => ({ getApiContent: vi.fn<ApiCall>() }));
vi.mock("@services/user-service", () => api);
vi.mock("@services/auth-service", () => ({ getCurrenUser: () => null }));

import { SearchResultsPage } from "./search-results-page";

const HITS = [
    { id: 10, type: "work", header: "Vihreä matka", author: "Kemppinen, Jukka", description: "<p>Matka <b>avaruuteen</b></p>" },
    { id: 3, type: "tag", header: "matkat" },
    { id: 11, type: "work", header: "Vihreä planeetta" },
    { id: 7, type: "person", header: "Matkala, Matti" },
];

let root: Root | null = null;
let container: HTMLElement;

// The results page reads its term from the URL, so it gets its own router.
const Location = () => <span id="location">{useLocation().search}</span>;
const renderAt = (url: string) => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    act(() => root!.render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[url]}>
                <Routes><Route path="/search" element={<><SearchResultsPage /><Location /></>} /></Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    ));
};

beforeEach(() => {
    api.getApiContent.mockResolvedValue({ data: HITS });
    localStorage.clear();
});

afterEach(() => {
    act(() => root?.unmount());
    root = null;
    document.body.innerHTML = "";
    vi.clearAllMocks();
});

const headings = () => [...container.querySelectorAll("h2")].map(h => h.textContent);

describe("SearchResultsPage", () => {
    it("asks for up to 500 hits for the URL's term, encoded", async () => {
        renderAt("/search?q=Vihre%C3%A4%20matka&titles=1");
        await waitFor(() => expect(headings().length).toBeGreaterThan(0));
        expect(api.getApiContent).toHaveBeenCalledWith(
            "search/Vihre%C3%A4%20matka?limit=500&titles=1", null);
        expect(container.querySelector("h1")?.textContent).toBe("Haku: Vihreä matka");
    });

    it("lists the hits grouped by type, with links, authors and plain-text descriptions", async () => {
        renderAt("/search?q=matka");
        await waitFor(() => expect(headings()).toEqual(["Teokset2", "Henkilöt1", "Asiasanat1"]));
        expect(container.textContent).toContain("4 tulosta");

        const work = byText("Vihreä matka", container).find(el => el.tagName === "A")!;
        expect(work.getAttribute("href")).toBe("/works/10");
        const li = work.closest("li")!;
        expect(li.textContent).toContain(": Kemppinen, Jukka");
        expect(li.textContent).toContain("Matka avaruuteen");
        expect(byText("matkat", container)[0].getAttribute("href")).toBe("/tags/3");

        const jumps = [...container.querySelectorAll("nav a")].map(a => [a.textContent, a.getAttribute("href")]);
        expect(jumps).toEqual([
            ["Teokset (2)", "#search-work"], ["Henkilöt (1)", "#search-person"], ["Asiasanat (1)", "#search-tag"],
        ]);
    });

    it("says when nothing was found", async () => {
        api.getApiContent.mockResolvedValue({ data: [] });
        renderAt("/search?q=xyzzy");
        await waitFor(() => expect(byText("Ei tuloksia.", container)).toHaveLength(1));
    });

    it("doesn't search with a too short term", async () => {
        renderAt("/search?q=ma");
        await waitFor(() => expect(byText("Kirjoita hakuun vähintään 3 merkkiä.", container)).toHaveLength(1));
        expect(api.getApiContent).not.toHaveBeenCalled();
    });

    it("notes when the hits were cut at the limit", async () => {
        api.getApiContent.mockResolvedValue({
            data: Array.from({ length: 500 }, (_, i) => ({ id: i, type: "work", header: `Teos ${i}` })),
        });
        renderAt("/search?q=maailma");
        await waitFor(() => expect(container.textContent).toMatch(/500 tulosta \(näytetään 500 ensimmäistä\)/));
    });

    it("toggles titles-only in the URL and remembers it for the menu", async () => {
        renderAt("/search?q=matka&titles=1");
        await waitFor(() => expect(headings().length).toBeGreaterThan(0));
        click(container.querySelector("#searchPageTitlesOnly"));
        await waitFor(() => expect(container.querySelector("#location")?.textContent).toBe("?q=matka"));
        expect(localStorage.getItem("searchTitlesOnly")).toBe("0");
        await waitFor(() => expect(api.getApiContent).toHaveBeenLastCalledWith("search/matka?limit=500", null));
    });
});
