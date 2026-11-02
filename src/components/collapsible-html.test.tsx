// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CollapsibleHtml } from "./collapsible-html";
import { button, cleanup, click, render } from "../test-utils/render";

// jsdom has no layout: give every element the text height under test.
let contentHeight = 0;

beforeEach(() => {
    vi.stubGlobal("ResizeObserver", class { observe() { } disconnect() { } });
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(() => contentHeight);
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

// 12rem at jsdom's 16px root font size is 192px; collapsing starts above 1.3x that.
const LONG = 1000;
const ALMOST = 240;

const content = (container: HTMLElement) => container.querySelector<HTMLElement>(".html-content")!;

describe("CollapsibleHtml", () => {
    it("shows short text in full, without a button", () => {
        contentHeight = 100;
        const container = render(<CollapsibleHtml html="<p>Lyhyt kuvaus</p>" />);
        expect(content(container).classList).not.toContain("collapsible-html-collapsed");
        expect(content(container).style.maxHeight).toBe("");
        expect(button("Näytä koko kuvaus")).toBeNull();
    });

    it("doesn't collapse text that is only a little over the limit", () => {
        contentHeight = ALMOST;
        const container = render(<CollapsibleHtml html="<p>Melkein pitkä</p>" />);
        expect(content(container).classList).not.toContain("collapsible-html-collapsed");
        expect(button("Näytä koko kuvaus")).toBeNull();
    });

    it("clips long text and toggles it by clicking the text", () => {
        contentHeight = LONG;
        const container = render(<CollapsibleHtml html="<p>Pitkä kuvaus</p>" />);
        const text = content(container);
        expect(text.classList).toContain("collapsible-html-collapsed");
        expect(text.style.maxHeight).toBe("12rem");
        expect(button("Näytä koko kuvaus")?.getAttribute("aria-expanded")).toBe("false");

        click(text.querySelector("p"));
        expect(text.classList).not.toContain("collapsible-html-collapsed");
        expect(button("Näytä vähemmän")?.getAttribute("aria-expanded")).toBe("true");

        click(text.querySelector("p"));
        expect(text.classList).toContain("collapsible-html-collapsed");
    });

    it("toggles with the button", () => {
        contentHeight = LONG;
        const container = render(<CollapsibleHtml html="<p>Pitkä kuvaus</p>" />);
        click(button("Näytä koko kuvaus"));
        expect(content(container).classList).not.toContain("collapsible-html-collapsed");
        click(button("Näytä vähemmän"));
        expect(content(container).classList).toContain("collapsible-html-collapsed");
    });

    it("lets links in the text work instead of toggling", () => {
        contentHeight = LONG;
        const container = render(<CollapsibleHtml html='<p>Katso <a href="#lahde">lähde</a></p>' />);
        click(content(container).querySelector("a"));
        expect(content(container).classList).toContain("collapsible-html-collapsed");
    });

    it("uses the given collapsed height", () => {
        contentHeight = LONG;
        const container = render(<CollapsibleHtml html="<p>Pitkä</p>" collapsedHeight={6} />);
        expect(content(container).style.maxHeight).toBe("6rem");
    });
});
