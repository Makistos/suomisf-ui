// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { actAsync, button, byText, cleanup, click, render, waitFor } from "../../../test-utils/render";

// Loose signature: the mocks answer with only the fields the component reads.
type ApiCall = (url: string, ...rest: any[]) => Promise<any>;
const api = vi.hoisted(() => ({
    getApiContent: vi.fn<ApiCall>(),
    postApiContent: vi.fn<ApiCall>(),
}));
vi.mock("@services/user-service", () => api);
vi.mock("@services/auth-service", () => ({ getCurrenUser: () => ({ id: 1, name: "admin", role: "admin" }) }));

import { WorkLinkSources } from "./work-link-sources";

const SOURCES = [
    { source: "Kansalliskirjasto", count: 1968, works: 1950 },
    { source: "Kansallikirjasto", count: 5, works: 5 },
    { source: "Kansalliskirjasato", count: 1, works: 1 },
    { source: null, count: 2, works: 2 },
];

beforeEach(() => {
    api.getApiContent.mockImplementation(async (url: string) => {
        if (url === "worklinks/sources") return { data: SOURCES };
        if (url.startsWith("worklinks/sources/links")) {
            return { data: [{ id: 7, link: "https://example.org/x", work_id: 3, work_title: "Teos X" }] };
        }
        throw new Error(`unexpected GET ${url}`);
    });
    api.postApiContent.mockImplementation(async (url: string) => {
        if (url === "worklinks/sources/merge") return { response: { updated: 6 }, status: 200 };
        if (url === "worklinks/sources/delete") return { response: { deleted: 1 }, status: 200 };
        throw new Error(`unexpected POST ${url}`);
    });
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
const check = (label: string) => click(row(label).querySelector(".p-checkbox-input"));

const renderLoaded = async () => {
    render(<WorkLinkSources />);
    await waitFor(() => row("Kansalliskirjasto"));
};

describe("WorkLinkSources", () => {
    it("lists every source with its link and work counts, most used first", async () => {
        await renderLoaded();
        const cells = [...document.querySelectorAll("tbody tr")].map(tr =>
            [...tr.querySelectorAll("td")].slice(2, 5).map(td => td.textContent));
        expect(cells).toEqual([
            ["Kansalliskirjasto", "1968", "1950"],
            ["Kansallikirjasto", "5", "5"],
            ["(ei lähdettä)", "2", "2"],
            ["Kansalliskirjasato", "1", "1"],
        ]);
    });

    it("shows a source's links when its row is expanded", async () => {
        await renderLoaded();
        click(row("Kansallikirjasto").querySelector(".p-row-toggler"));
        await waitFor(() => expect(byText("Teos X")).toHaveLength(1));
        expect(api.getApiContent).toHaveBeenCalledWith(
            "worklinks/sources/links?source=Kansallikirjasto", expect.anything());
    });

    it("asks for links without a source with an empty source", async () => {
        await renderLoaded();
        click(row("(ei lähdettä)").querySelector(".p-row-toggler"));
        await waitFor(() => expect(api.getApiContent).toHaveBeenCalledWith(
            "worklinks/sources/links?source=", expect.anything()));
    });

    it("combines the selected sources into the most used one", async () => {
        await renderLoaded();
        expect(button("Yhdistä valitut (0)")?.disabled).toBe(true);
        check("Kansallikirjasto");
        check("Kansalliskirjasto");
        check("Kansalliskirjasato");

        click(button("Yhdistä valitut (3)"));
        const dialog = document.querySelector(".p-dialog")!;
        expect(dialog.textContent).toContain("1974 linkkiä");
        const input = dialog.querySelector<HTMLInputElement>("#merge-target")!;
        expect(input.value).toBe("Kansalliskirjasto");
        // The label's input is the one typed in, not a hidden read-only helper.
        expect(input.readOnly).toBe(false);
        expect(input.closest(".p-hidden-accessible")).toBeNull();

        click(button("Yhdistä", dialog));
        await waitFor(() => expect(api.postApiContent).toHaveBeenCalled());
        const [url, body] = api.postApiContent.mock.calls[0];
        expect(url).toBe("worklinks/sources/merge");
        expect(body.target).toBe("Kansalliskirjasto");
        expect([...body.sources].sort()).toEqual(["Kansallikirjasto", "Kansalliskirjasato", "Kansalliskirjasto"]);
        // The list is reloaded afterwards.
        await waitFor(() => expect(api.getApiContent.mock.calls
            .filter(([u]) => u === "worklinks/sources")).toHaveLength(2));
    });

    it("renames a single selected source", async () => {
        await renderLoaded();
        check("Kansallikirjasto");
        click(button("Nimeä uudelleen"));
        const dialog = document.querySelector(".p-dialog")!;
        expect(dialog.textContent).toContain("Nimeä lähde uudelleen");
        click(button("Nimeä", dialog));
        await waitFor(() => expect(api.postApiContent).toHaveBeenCalledWith(
            "worklinks/sources/merge",
            { sources: ["Kansallikirjasto"], target: "Kansallikirjasto" },
            expect.anything()));
    });

    it("can't combine into an empty name", async () => {
        await renderLoaded();
        check("(ei lähdettä)");
        click(button("Nimeä uudelleen"));
        // Only links without a source are selected, so there is no name to suggest.
        const dialog = document.querySelector(".p-dialog")!;
        expect(dialog.querySelector<HTMLInputElement>("#merge-target")?.value).toBe("");
        expect(button("Nimeä", dialog)?.disabled).toBe(true);
    });

    it("deletes a source after confirmation", async () => {
        await renderLoaded();
        click(button("Poista lähde Kansalliskirjasato", row("Kansalliskirjasato")));
        await actAsync();
        const confirm = document.querySelector(".p-confirm-dialog")!;
        expect(confirm.textContent).toContain('Poistetaanko lähde "Kansalliskirjasato" ja sen 1 linkkiä 1 teoksesta?');
        expect(api.postApiContent).not.toHaveBeenCalled();

        click(button("Poista", confirm));
        await waitFor(() => expect(api.postApiContent).toHaveBeenCalledWith(
            "worklinks/sources/delete", { source: "Kansalliskirjasato" }, expect.anything()));
    });

    it("doesn't delete when the confirmation is cancelled", async () => {
        await renderLoaded();
        click(button("Poista lähde Kansallikirjasto", row("Kansallikirjasto")));
        await actAsync();
        click(button("Peruuta", document.querySelector(".p-confirm-dialog")!));
        await actAsync();
        expect(api.postApiContent).not.toHaveBeenCalled();
    });
});
