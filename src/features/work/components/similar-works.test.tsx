// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { actAsync, button, byText, cleanup, click, render, waitFor } from "../../../test-utils/render";

// Loose signature: the mocks answer with only the fields the code reads.
type ApiCall = (url: string, ...rest: any[]) => Promise<any>;
const api = vi.hoisted(() => ({ getApiContent: vi.fn<ApiCall>() }));
vi.mock("@services/user-service", () => api);

import { reasonText, SimilarWorks, SimilarWork } from "./similar-works";

const ADMIN = { id: 1, name: "admin", role: "admin" } as any;
const USER = { id: 2, name: "user", role: "user" } as any;

const WORKS: SimilarWork[] = [
    {
        id: 2390, title: "Ennustusten aika", author_str: "Eddings, David", pubyear: 1982,
        image: { image_src: "/images/a.jpg", thumb_src: "/images/thumbs/a.webp" },
        reasons: [
            { type: 2, type_name: "Alagenre", tags: [{ id: 1, name: "korkea fantasia" }] },
            { type: "description", type_name: "Kuvaus", tags: [] },
            { type: 1, type_name: "Aihe", tags: [{ id: 3, name: "magia" }] },
        ],
    },
    {
        id: 1514, title: "Taru sormusten herrasta", author_str: "Tolkien, J. R. R.", pubyear: null,
        image: null,
        reasons: [{ type: 1, type_name: "Aihe", tags: [{ id: 4, name: "a" }, { id: 5, name: "b" }, { id: 6, name: "c" }] }],
    },
];

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("reasonText", () => {
    it("names the tag type and at most two tags, or the description", () => {
        expect(reasonText(WORKS[0].reasons[0])).toBe("Yhteinen alagenre: korkea fantasia");
        expect(reasonText(WORKS[0].reasons[1])).toBe("Samankaltainen kuvaus");
        expect(reasonText(WORKS[1].reasons[0])).toBe("Yhteinen aihe: a, b");
    });
});

describe("SimilarWorks", () => {
    it("opens the list for an admin: covers, links, years and two reasons", async () => {
        api.getApiContent.mockResolvedValue({ data: WORKS });
        render(<SimilarWorks workId={292} user={ADMIN} />);
        await waitFor(() => expect(button("Samankaltaisia teoksia")).not.toBeNull());
        expect(api.getApiContent).toHaveBeenCalledWith("works/292/similar?limit=8", ADMIN);

        click(button("Samankaltaisia teoksia"));
        await waitFor(() => expect(byText("Ennustusten aika")).toHaveLength(1));
        expect(byText("Ennustusten aika")[0].closest("a")?.getAttribute("href")).toBe("/works/2390");
        expect(document.body.textContent).toContain("Eddings, David (1982)");
        // No year: no empty brackets.
        expect(document.body.textContent).toContain("Tolkien, J. R. R.");
        expect(document.body.textContent).not.toContain("Tolkien, J. R. R. (");
        expect(document.body.textContent).toContain("Yhteinen alagenre: korkea fantasia · Samankaltainen kuvaus");
        expect(document.body.textContent).not.toContain("magia");
        const img = document.querySelector<HTMLImageElement>("img.similar-works-cover");
        expect(img?.getAttribute("src")).toContain("/images/thumbs/a.webp");
        expect(img?.alt).toBe("Kansikuva: Ennustusten aika");
        expect(document.querySelectorAll("li")).toHaveLength(2);
    });

    it("shows nothing when the work has no similar works", async () => {
        api.getApiContent.mockResolvedValue({ data: [] });
        render(<SimilarWorks workId={2} user={ADMIN} />);
        await waitFor(() => expect(api.getApiContent).toHaveBeenCalled());
        await actAsync();
        expect(button("Samankaltaisia teoksia")).toBeNull();
    });

    it("shows nothing and asks nothing for other users", async () => {
        render(<SimilarWorks workId={292} user={USER} />);
        await actAsync();
        expect(api.getApiContent).not.toHaveBeenCalled();
        expect(button("Samankaltaisia teoksia")).toBeNull();
    });
});
