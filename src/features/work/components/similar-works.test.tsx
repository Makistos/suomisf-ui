// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { actAsync, button, byText, cleanup, click, render, waitFor } from "../../../test-utils/render";

// Loose signature: the mocks answer with only the fields the code reads.
type ApiCall = (url: string, ...rest: any[]) => Promise<any>;
const api = vi.hoisted(() => ({ getApiContent: vi.fn<ApiCall>() }));
vi.mock("@services/user-service", () => api);

import { formatValue, partsText, reasonText, scoreText, shownReasons, SimilarWorks, SimilarWork, tagTypesText } from "./similar-works";

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
        score: 0.6337,
        signals: { S: 0.65, T: 0.9118, T_raw: 0.5124, D: 0.39, G: 0.5, Y: 0.74, coverage: 0.94,
            types: { "1": 0.46, "2": 1, "3": 0 }, same_series: false, multiplier: 1,
            parts: { T: 0.42, D: 0.16, G: 0.06, Y: 0.01 }, type_parts: { "1": 0.12, "2": 0.3, "3": 0 } },
    },
    {
        id: 1514, title: "Taru sormusten herrasta", author_str: "Tolkien, J. R. R.", pubyear: null,
        image: null,
        reasons: [
            { type: 2, type_name: "Alagenre", tags: [{ id: 7, name: "x" }] },
            { type: "description", type_name: "Kuvaus", tags: [] },
            { type: 1, type_name: "Aihe", tags: [
                { id: 4, name: "a" }, { id: 5, name: "b" }, { id: 6, name: "c" },
                { id: 8, name: "d" }, { id: 9, name: "e" }] },
        ],
    },
];

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("reasonText", () => {
    it("names the tag type and its tags (four themes, two of others), or the description", () => {
        expect(reasonText(WORKS[0].reasons[0])).toBe("Yhteinen alagenre: korkea fantasia");
        expect(reasonText(WORKS[0].reasons[1])).toBe("Samankaltainen kuvaus");
        expect(reasonText(WORKS[1].reasons[2])).toBe("Yhteinen aihe: a, b, c, d");
    });
});

describe("shownReasons", () => {
    it("adds shared themes when there are two or more, even below the first two", () => {
        expect(shownReasons(WORKS[1].reasons).map(r => r.type)).toEqual([2, "description", 1]);
        // A single shared theme stays out.
        expect(shownReasons(WORKS[0].reasons).map(r => r.type)).toEqual([2, "description"]);
    });
});

describe("values", () => {
    it("formats numbers with decimal commas", () => {
        expect(formatValue(0.5)).toBe("0,50");
        expect(formatValue(null)).toBe("–");
    });

    it("shows each signal's weighted share with its own value, adding up to S", () => {
        expect(partsText(WORKS[0].signals)).toBe(
            "Asiasanat 0,42 (0,91) · Kuvaus 0,16 (0,39) · Genre 0,06 (0,50) · Vuosi 0,01 (0,74) = 0,65");
        // Lists computed before shares were stored: the values only.
        expect(partsText({ T: 0.5, D: 0.2 })).toBe("Asiasanat 0,50 · Kuvaus 0,20");
    });

    it("splits the tags' share by type, leaving out types with nothing shared", () => {
        // Tyyli has no shared tags: left out.
        expect(tagTypesText(WORKS[0].signals)).toBe("Aihe 0,12 (0,46) · Alagenre 0,30 (1,00)");
        expect(tagTypesText({ types: { "1": 0.4 } })).toBe("Aihe 0,40");
    });

    it("shows how the score comes from S", () => {
        expect(scoreText(WORKS[0])).toBe("Pisteet 0,63 = 0,65 × kattavuus 0,97");
        expect(scoreText({ ...WORKS[0], score: 0.12,
            signals: { S: 0.5, coverage: 0.94, multiplier: 0.25, same_series: true } }))
            .toBe("Pisteet 0,12 = 0,50 × kattavuus 0,97 × 0,25 sama sarja");
        expect(scoreText({ ...WORKS[0], score: 0.3,
            signals: { S: 0.62, coverage: 0.94, multiplier: 0.5, same_series: false } }))
            .toBe("Pisteet 0,30 = 0,62 × kattavuus 0,97 × 0,50 ikäryhmä");
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
        // Values under the first work; none for one without signals.
        expect(document.querySelectorAll(".similar-works-values")).toHaveLength(1);
        expect(document.body.textContent).toContain("Asiasanat 0,42 (0,91)");
        expect(document.body.textContent).toContain("Pisteet 0,63 = 0,65");
        expect(document.body.textContent).toContain("Yhteinen aihe: a, b, c, d");
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
