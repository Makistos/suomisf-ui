// @vitest-environment jsdom
import { act } from "react";
import { useLocation } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { ImageAccordion, ImageAccordionItem } from "./image-accordion";
import { cleanup, render } from "../test-utils/render";

const items: ImageAccordionItem[] = [1, 2, 3].map(id => ({
    id,
    imageSrc: null,
    imageAlt: `Teos ${id}`,
    title: `Teos ${id}`,
    author: `Kirjailija ${id}`,
    description: `<p>Kuvaus ${id}</p>`,
    linkTo: `/editions/${id}`,
}));

afterEach(cleanup);

// Shows the router's current path, to see whether a click navigated.
const Location = () => <span id="location">{useLocation().pathname}</span>;
const renderAccordion = () => render(<><ImageAccordion items={items} /><Location /></>);
const location = () => document.getElementById("location")!.textContent;

const overlay = () => document.querySelector<HTMLElement>(".image-accordion-overlay");
const cover = (index: number) =>
    document.querySelectorAll<HTMLElement>(".image-accordion-item .image-accordion-cover-link")[index];
const overlayCover = () => overlay()!.querySelector<HTMLElement>(".image-accordion-cover-link")!;

const pointer = (el: Element, type: string, pointerType: string) =>
    act(() => {
        el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType }));
    });

/** A tap or mouse click: pointerdown then click. */
const press = (el: Element, pointerType: "touch" | "mouse") => {
    pointer(el, "pointerdown", pointerType);
    act(() => {
        el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    });
};

describe("ImageAccordion on a touch screen", () => {
    it("opens the panel on the first tap instead of following the link", () => {
        renderAccordion();
        expect(overlay()).toBeNull();

        press(cover(1), "touch");
        expect(overlay()?.textContent).toContain("Kuvaus 2");
        expect(location()).toBe("/");
    });

    it("follows the link when the cover in the open panel is tapped", () => {
        renderAccordion();
        press(cover(1), "touch");
        press(overlayCover(), "touch");
        expect(location()).toBe("/editions/2");
    });

    it("closes the panel on a tap outside it", () => {
        renderAccordion();
        press(cover(0), "touch");
        expect(overlay()).not.toBeNull();

        pointer(document.body, "pointerdown", "touch");
        expect(overlay()).toBeNull();
    });

    it("keeps the panel open on a tap inside it", () => {
        renderAccordion();
        press(cover(0), "touch");
        pointer(overlay()!.querySelector(".image-accordion-details")!, "pointerdown", "touch");
        expect(overlay()).not.toBeNull();
    });

    it("switches to another cover's panel when that cover is tapped", () => {
        renderAccordion();
        press(cover(0), "touch");
        // The tap outside the panel closes it, the click then opens the next one.
        pointer(document.body, "pointerdown", "touch");
        press(cover(2), "touch");
        expect(overlay()?.textContent).toContain("Kuvaus 3");
        expect(location()).toBe("/");
    });

    it("ignores the pointerenter a tap fires", () => {
        renderAccordion();
        pointer(cover(1), "pointerover", "touch");
        expect(overlay()).toBeNull();
    });

    it("keeps the covered item in place (transparent, not hidden) while its panel is open", () => {
        renderAccordion();
        press(cover(1), "touch");
        const item = document.querySelectorAll<HTMLElement>(".image-accordion-item")[1];
        expect(item.style.opacity).toBe("0");
        expect(item.style.visibility).toBe("");
    });
});

describe("ImageAccordion with a mouse", () => {
    it("opens the panel on hover and follows the link on the first click", () => {
        renderAccordion();
        pointer(cover(1), "pointerover", "mouse");
        expect(overlay()?.textContent).toContain("Kuvaus 2");
        press(overlayCover(), "mouse");
        expect(location()).toBe("/editions/2");
    });

    it("doesn't intercept a click on a cover", () => {
        renderAccordion();
        press(cover(0), "mouse");
        expect(location()).toBe("/editions/1");
    });

    it("closes the panel when the mouse leaves", async () => {
        renderAccordion();
        pointer(cover(1), "pointerover", "mouse");
        // Leaving the item for somewhere outside the accordion.
        act(() => {
            cover(1).dispatchEvent(new PointerEvent("pointerout", {
                bubbles: true, pointerType: "mouse", relatedTarget: document.body,
            }));
        });
        // Deactivation is deferred by a tick (see scheduleDeactivate).
        await act(() => new Promise(resolve => setTimeout(resolve, 10)));
        expect(overlay()).toBeNull();
    });
});
