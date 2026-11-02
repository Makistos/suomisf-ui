// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { button, byText, cleanup, click, render, waitFor } from "../../../test-utils/render";

// Loose signature: the mocks answer with only the fields the code reads.
type ApiCall = (url: string, ...rest: any[]) => Promise<any>;
const api = vi.hoisted(() => ({ postApiContent: vi.fn<ApiCall>(), getApiContent: vi.fn<ApiCall>() }));
vi.mock("@services/user-service", () => api);
vi.mock("@services/auth-service", () => ({ getCurrenUser: () => ({ id: 1, name: "admin", role: "admin" }) }));

import { fetchIncompleteWorks } from "../api/incomplete-works";
import { RandomIncompleteWorks } from "./random-incomplete-works";
import { KirjasampoUnimportedWorks } from "./kirjasampo-unimported-works";

const WORKS = [
    {
        id: 5, title: "Luolien suojatit", work_type: { id: 1, name: "Romaani" }, editions: [{}, {}],
        contributions: [
            { role: { id: 1 }, person: { name: "Auel, Jean M." } },
            { role: { id: 2 }, person: { name: "Kääntäjä, Kalle" } },
        ],
    },
    { id: 9, title: "Antologia", work_type: { id: 2, name: "Kokoelma" }, editions: [{}], contributions: [] },
];

const found = { response: { works: WORKS, total: 1138 }, status: 200 };

beforeEach(() => {
    api.postApiContent.mockResolvedValue(found);
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("fetchIncompleteWorks", () => {
    it("posts the count and missing fields", async () => {
        const result = await fetchIncompleteWorks(3, ["description", "tags"], null);
        expect(api.postApiContent).toHaveBeenCalledWith(
            "works/random/incomplete", { count: 3, missing_fields: ["description", "tags"] }, null);
        expect(result.total).toBe(1138);
        expect(result.works.map(w => w.id)).toEqual([5, 9]);
    });

    it("treats the backend's 404 (nothing matches) as an empty result", async () => {
        api.postApiContent.mockRejectedValue({ response: "No works found", status: 404 });
        expect(await fetchIncompleteWorks(10, ["image"], null)).toEqual({ works: [], total: 0 });
    });

    it("passes other errors on", async () => {
        api.postApiContent.mockRejectedValue({ response: "Database error", status: 500 });
        await expect(fetchIncompleteWorks(10, [], null)).rejects.toMatchObject({ status: 500 });
    });
});

describe("RandomIncompleteWorks", () => {
    it("searches with the checked fields and lists the works", async () => {
        render(<RandomIncompleteWorks />);
        click(document.querySelector("#incomplete-description"));
        click(document.querySelector("#incomplete-image"));
        click(document.querySelector("#incomplete-image"));
        click(document.querySelector("#incomplete-binding"));
        click(button("Hae teoksia"));

        await waitFor(() => expect(byText("Luolien suojatit")).toHaveLength(1));
        expect(api.postApiContent).toHaveBeenCalledWith(
            "works/random/incomplete", { count: 10, missing_fields: ["description", "binding"] }, expect.anything());
        expect(document.body.textContent).toMatch(/\(2 näytetty, 1\s138 yhteensä\)/);
        // Authors only (not translators), and the work links to its page.
        const heading = byText("Luolien suojatit")[0].closest("h4")!;
        expect(heading.textContent).toContain("Auel, Jean M.");
        expect(heading.textContent).not.toContain("Kääntäjä");
        expect(byText("Luolien suojatit")[0].closest("a")?.getAttribute("href")).toBe("/works/5");
        expect(document.body.textContent).toContain("Romaani. Painoksia: 2");
    });

    it("says so when nothing matches", async () => {
        api.postApiContent.mockRejectedValue({ response: "No works found", status: 404 });
        render(<RandomIncompleteWorks />);
        click(button("Hae teoksia"));
        await waitFor(() => expect(byText("Teoksia ei löytynyt.")).toHaveLength(1));
    });

    it("shows an error when the search fails", async () => {
        api.postApiContent.mockRejectedValue({ response: "Database error", status: 500 });
        render(<RandomIncompleteWorks />);
        click(button("Hae teoksia"));
        await waitFor(() => expect(byText("Haku epäonnistui.")).toHaveLength(1));
    });
});

describe("KirjasampoUnimportedWorks", () => {
    it("searches for linked works without imported Kirjasampo tags", async () => {
        render(<KirjasampoUnimportedWorks />);
        click(button("Hae teoksia"));
        await waitFor(() => expect(byText("Antologia")).toHaveLength(1));
        expect(api.postApiContent).toHaveBeenCalledWith(
            "works/random/incomplete", { count: 10, missing_fields: ["kirjasampo_tags"] }, expect.anything());
    });
});
