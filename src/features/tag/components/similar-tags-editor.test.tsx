// @vitest-environment jsdom
import { act } from "react";
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

import { SimilarTagsEditor } from "./similar-tags-editor";

const type = (id: number) => ({ id, name: id === 5 ? "Paikka" : "Asiasana" });

let similar: object[];

beforeEach(() => {
    similar = [
        { id: 2, name: "robotit", type: type(1), kind: "duplicate", reason: "baseform" },
        { id: 3, name: "kyborgit", type: type(1), kind: "related", reason: "manual" },
        { id: 5, name: "androidit", type: type(1), kind: "related", reason: "concept" },
    ];
    api.getApiContent.mockImplementation(async (url: string) => {
        if (url === "tags/1/similar") return { data: similar };
        if (url.startsWith("filter/tags/")) {
            return { data: [
                { id: 1, name: "robotti", type: type(1) },
                { id: 2, name: "robotit", type: type(1) },
                { id: 4, name: "robottiajoneuvot", type: type(1) },
            ] };
        }
        throw new Error(`unexpected GET ${url}`);
    });
    api.postApiContent.mockResolvedValue({ response: {}, status: 200 });
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

const item = (name: string) => byText(name).find(el => el.closest("li"))!.closest("li")!;

const renderLoaded = async () => {
    render(<SimilarTagsEditor tagId={1} />);
    await waitFor(() => item("kyborgit"));
};

/** Type into the AutoComplete the way a user does. */
const typeInto = (input: HTMLInputElement, text: string) => {
    act(() => {
        const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
        setValue.call(input, text);
        input.dispatchEvent(new Event("input", { bubbles: true }));
    });
};

describe("SimilarTagsEditor", () => {
    it("lists the similar tags with their kind and reason", async () => {
        await renderLoaded();
        expect(item("robotit").textContent).toContain("Kaksoiskappale, sama perusmuoto");
        expect(item("kyborgit").textContent).toContain("Liittyvä, lisätty käsin");
        expect(item("androidit").textContent).toContain("Liittyvä, sama käsite");
        expect(item("robotit").querySelector("a")?.getAttribute("href")).toBe("/tags/2");
    });

    it("removes a tag and reloads the list", async () => {
        await renderLoaded();
        click(button("Poista robotit"));
        await waitFor(() => expect(api.postApiContent).toHaveBeenCalledWith(
            "tags/similar/dismiss", { tag_a: 1, tag_b: 2 }, expect.anything()));
        await waitFor(() => expect(api.getApiContent.mock.calls
            .filter(([u]) => u === "tags/1/similar")).toHaveLength(2));
    });

    it("adds a found tag, offering neither the tag itself nor listed ones", async () => {
        await renderLoaded();
        expect(button("Lisää")?.disabled).toBe(true);
        typeInto(document.querySelector<HTMLInputElement>("#similar-tag-add")!, "robo");
        await waitFor(() => expect(document.querySelectorAll(".p-autocomplete-item")).toHaveLength(1), 3000);
        expect(document.querySelector(".p-autocomplete-item")?.textContent).toBe("robottiajoneuvot");
        click(document.querySelector(".p-autocomplete-item"));
        click(button("Lisää"));
        await waitFor(() => expect(api.postApiContent).toHaveBeenCalledWith(
            "tags/similar/add", { tag_a: 1, tag_b: 4 }, expect.anything()));
    });

    it("says so when the save fails", async () => {
        api.postApiContent.mockRejectedValue({ status: 500 });
        await renderLoaded();
        click(button("Poista kyborgit"));
        await waitFor(() => expect(document.body.textContent).toContain("Tallennus epäonnistui."));
    });

    it("says so when there are none", async () => {
        similar = [];
        render(<SimilarTagsEditor tagId={1} />);
        await waitFor(() => expect(document.body.textContent).toContain("Ei samankaltaisia asiasanoja."));
    });
});
