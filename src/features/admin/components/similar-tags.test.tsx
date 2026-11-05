// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { button, byText, cleanup, click, render, waitFor } from "../../../test-utils/render";

// Loose signature: the mocks answer with only the fields the component reads.
type ApiCall = (url: string, ...rest: any[]) => Promise<any>;
const api = vi.hoisted(() => ({
    getApiContent: vi.fn<ApiCall>(),
    postApiContent: vi.fn<ApiCall>(),
}));
vi.mock("@services/user-service", () => api);
vi.mock("@services/auth-service", () => ({ getCurrenUser: () => ({ id: 1, name: "admin", role: "admin" }) }));

import { SimilarTags } from "./similar-tags";

const tag = (id: number, name: string, uses: number, typeId = 1) =>
    ({ id, name, uses, type: { id: typeId, name: typeId === 5 ? "Paikka" : "Asiasana" } });

const pair = (a: ReturnType<typeof tag>, b: ReturnType<typeof tag>, extra: object) => ({
    tag_a: a, tag_b: b, name_score: null, containment: null, shared: 0,
    status: "new", decided_by: null, decided_at: null, ...extra,
});

const ROBOT = tag(1, "robotti", 3);
const ROBOTS = tag(2, "robotit", 40);
const USA = tag(3, "usa", 5, 5);
const US = tag(4, "yhdysvallat", 2, 5);
const AI = tag(5, "tekoäly", 30);
const SOUND = tag(6, "ääni", 4);
const SOUNDS = tag(7, "äänet", 1);

const DUPLICATES = [
    pair(ROBOT, ROBOTS, { kind: "duplicate", reason: "baseform", name_score: 0.97 }),
    pair(USA, US, { kind: "duplicate", reason: "place" }),
    pair(SOUND, SOUNDS, { kind: "duplicate", reason: "baseform", name_score: 0.9 }),
];
const RELATED = [
    pair(ROBOTS, AI, { kind: "related", reason: "usage", containment: 0.93, shared: 12 }),
];
const DISMISSED = [
    pair(ROBOT, AI, { kind: "related", reason: "name", name_score: 0.92, status: "dismissed",
        decided_by: "admin", decided_at: "2026-11-05T10:00:00+00:00" }),
];

beforeEach(() => {
    api.getApiContent.mockImplementation(async (url: string) => {
        const pairs = {
            "tags/similar?kind=duplicate": DUPLICATES,
            "tags/similar?kind=related": RELATED,
            "tags/similar?status=dismissed": DISMISSED,
        }[url];
        if (!pairs) throw new Error(`unexpected GET ${url}`);
        return { data: { updated: "2026-11-05T09:00:00+00:00", pairs,
            counts: { duplicate: DUPLICATES.length, related: RELATED.length, dismissed: DISMISSED.length } } };
    });
    api.postApiContent.mockResolvedValue({ response: {}, status: 200 });
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

const row = (label: string) => {
    const cell = byText(label).find(el => el.closest("tbody tr"));
    if (!cell) throw new Error(`row ${label} not found`);
    return cell.closest("tr")!;
};

const renderLoaded = async () => {
    render(<SimilarTags />);
    await waitFor(() => row("yhdysvallat"));
};

const showView = async (label: string, rowLabel: string) => {
    click([...document.querySelectorAll(".p-selectbutton .p-button")]
        .find(el => el.textContent?.startsWith(label))!);
    await waitFor(() => row(rowLabel));
};

describe("SimilarTags", () => {
    it("lists duplicates with both tags, their uses, the reason and score", async () => {
        await renderLoaded();
        const cells = [...document.querySelectorAll("tbody tr")].map(tr =>
            [...tr.querySelectorAll("td")].slice(0, 3).map(td => td.textContent));
        // The first cell also has the reason, shown there on phones only.
        expect(cells).toEqual([
            ["robotti3robotit40Sama perusmuoto", "Sama perusmuoto", "0.97"],
            ["usa5yhdysvallat2Paikka", "Paikka", ""],
            ["ääni4äänet1Sama perusmuoto", "Sama perusmuoto", "0.90"],
        ]);
        expect(row("robotti").querySelector("a")?.getAttribute("href")).toBe("/tags/1");
        expect(document.body.textContent).toContain("Päivitetty");
    });

    it("shows how many pairs each view has", async () => {
        await renderLoaded();
        expect([...document.querySelectorAll(".p-selectbutton .p-button")].map(b => b.textContent))
            .toEqual(["Kaksoiskappaleet (3)", "Liittyvät (1)", "Hylätyt (1)"]);
    });

    it("sorts by tag name in Finnish order", async () => {
        await renderLoaded();
        const firstTags = () => [...document.querySelectorAll("tbody tr")]
            .map(tr => tr.querySelector(".p-tag")?.textContent);
        const header = [...document.querySelectorAll("th")].find(th => th.textContent?.includes("Asiasanat"))!;
        click(header);
        // "ääni" after "usa", not next to "a".
        await waitFor(() => expect(firstTags()).toEqual(["robotti", "usa", "ääni"]));
        click(header);
        await waitFor(() => expect(firstTags()).toEqual(["ääni", "usa", "robotti"]));
    });

    it("switches to related pairs, with the scores in a tooltip", async () => {
        await renderLoaded();
        await showView("Liittyvät", "tekoäly");
        expect(byText("Käytetään yhdessä").find(el => el.title)?.getAttribute("title"))
            .toBe("Yhteiskäyttö 0.93, 12 yhteistä kohdetta");
    });

    it("dismisses a pair", async () => {
        await renderLoaded();
        click(button("Eri asiasanat", row("usa")));
        await waitFor(() => expect(api.postApiContent).toHaveBeenCalledWith(
            "tags/similar/dismiss", { tag_a: 3, tag_b: 4 }, expect.anything()));
        // The list is reloaded afterwards.
        await waitFor(() => expect(api.getApiContent.mock.calls
            .filter(([u]) => u === "tags/similar?kind=duplicate")).toHaveLength(2));
    });

    it("lists dismissed pairs with who dismissed them, and restores one", async () => {
        await renderLoaded();
        await showView("Hylätyt", "tekoäly");
        expect(row("tekoäly").textContent).toContain("Liittyvä");
        expect(row("tekoäly").textContent).toContain("admin, ");
        expect(button("Eri asiasanat")).toBeNull();
        click(button("Palauta", row("tekoäly")));
        await waitFor(() => expect(api.postApiContent).toHaveBeenCalledWith(
            "tags/similar/restore", { tag_a: 1, tag_b: 5 }, expect.anything()));
    });

    it("merges the less used tag into the more used one", async () => {
        await renderLoaded();
        click(button("Yhdistä", row("robotti")));
        const dialog = document.querySelector(".p-dialog")!;
        expect(dialog.textContent).toMatch(/Poistetaanrobotti3.*Säilytetäänrobotit40/);
        click(button("Yhdistä", dialog));
        // Kept tag first: tags/<keep>/merge/<remove>.
        await waitFor(() => expect(api.postApiContent).toHaveBeenCalledWith(
            "tags/2/merge/1", {}, expect.anything()));
    });

    it("can swap which tag is kept", async () => {
        await renderLoaded();
        click(button("Yhdistä", row("robotti")));
        const dialog = document.querySelector(".p-dialog")!;
        click(button("Vaihda suunta", dialog));
        expect(dialog.textContent).toMatch(/Poistetaanrobotit40.*Säilytetäänrobotti3/);
        click(button("Yhdistä", dialog));
        await waitFor(() => expect(api.postApiContent).toHaveBeenCalledWith(
            "tags/1/merge/2", {}, expect.anything()));
    });

    it("doesn't merge when cancelled", async () => {
        await renderLoaded();
        click(button("Yhdistä", row("robotti")));
        click(button("Peruuta", document.querySelector(".p-dialog")!));
        await waitFor(() => expect(document.querySelector(".p-dialog")).toBeNull());
        expect(api.postApiContent).not.toHaveBeenCalled();
    });
});
