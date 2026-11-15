// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { actAsync, byText, cleanup, click, render, waitFor } from "../test-utils/render";

const auth = vi.hoisted(() => ({ getCurrenUser: vi.fn<() => unknown>() }));
vi.mock("../services/auth-service", () => auth);
// The real form loads its data from the API; here it only shows its id
// and can report a save.
vi.mock("@features/work/components/work-form", () => ({
    WorkForm: ({ workId, onSubmitCallback }: { workId: string, onSubmitCallback: (s: boolean, m: string) => void }) => (
        <div>
            <span>Lomake {workId}</span>
            <button onClick={() => onSubmitCallback(true, "")}>Tallenna</button>
        </div>
    ),
}));

import { ContributorWorkControl } from "./contributor-work-control";

const WORKS = [
    { id: 5, title: "Luolakarhun klaani", author_str: "Auel, Jean M.", work_type: { id: 1 }, editions: [], genres: [], tags: [], contributions: [] },
    { id: 9, title: "Hevosten laakso", subtitle: "Maan lapset 2", author_str: "Auel, Jean M.", work_type: { id: 1 }, editions: [], genres: [], tags: [], contributions: [] },
] as any[];

const editButtons = () => [...document.querySelectorAll<HTMLButtonElement>("button[aria-label^='Muokkaa teosta']")];

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("ContributorWorkControl", () => {
    it("shows a work's subtitle under its title", () => {
        auth.getCurrenUser.mockReturnValue(null);
        render(<ContributorWorkControl works={WORKS} personName="Auel, Jean M." />);
        expect(byText("Maan lapset 2")).toHaveLength(1);
    });

    it("lets an admin edit a work in the list in a dialog", async () => {
        auth.getCurrenUser.mockReturnValue({ id: 1, name: "admin", role: "admin" });
        render(<ContributorWorkControl works={WORKS} personName="Auel, Jean M." />);
        expect(editButtons().map(b => b.getAttribute("aria-label")))
            .toEqual(["Muokkaa teosta Hevosten laakso", "Muokkaa teosta Luolakarhun klaani"]);

        click(editButtons()[1]);
        await waitFor(() => expect(byText("Lomake 5")).toHaveLength(1));
        expect(document.body.textContent).toContain("Teoksen muokkaus");

        click(byText("Tallenna")[0]);
        await actAsync();
        expect(byText("Lomake 5")).toHaveLength(0);
        await waitFor(() => expect(document.body.textContent).toContain("Tallentaminen onnistui"));
    });

    it("shows no edit buttons to other users", () => {
        auth.getCurrenUser.mockReturnValue({ id: 2, name: "user", role: "user" });
        render(<ContributorWorkControl works={WORKS} personName="Auel, Jean M." />);
        expect(editButtons()).toHaveLength(0);
        auth.getCurrenUser.mockReturnValue(null);
        cleanup();
        render(<ContributorWorkControl works={WORKS} personName="Auel, Jean M." />);
        expect(editButtons()).toHaveLength(0);
    });
});
