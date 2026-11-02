import { act, ReactNode } from "react";
import { createRoot, Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Lets React know act() is in use, so state updates are flushed in tests.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let mounted: { root: Root; container: HTMLElement }[] = [];

/**
 * Render a component into the jsdom document inside a router and a fresh
 * react-query client (no retries). Minimal stand-in for
 * @testing-library/react; call cleanup() after each test.
 */
export const render = (ui: ReactNode) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    act(() => {
        root.render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>{ui}</MemoryRouter>
            </QueryClientProvider>,
        );
    });
    mounted.push({ root, container });
    return container;
};

export const cleanup = () => {
    for (const { root, container } of mounted) {
        act(() => root.unmount());
        container.remove();
    }
    mounted = [];
    // Portals (dialogs, toasts) are appended straight to body.
    document.body.innerHTML = "";
};

/** Run fn inside act() and let pending promises (fetches) settle. */
export const actAsync = async (fn: () => unknown = () => undefined) => {
    await act(async () => {
        await fn();
        await new Promise(resolve => setTimeout(resolve, 0));
    });
};

/** Wait until check() stops throwing (or times out), flushing React between tries. */
export const waitFor = async (check: () => void, timeout = 2000) => {
    const start = Date.now();
    for (;;) {
        try {
            check();
            return;
        } catch (error) {
            if (Date.now() - start > timeout) throw error;
            await actAsync();
        }
    }
};

export const click = (el: Element | null) => {
    if (!el) throw new Error("click: element not found");
    act(() => {
        (el as HTMLElement).click();
    });
};

/** All elements whose own text content matches text exactly (after trim). */
export const byText = (text: string, root: ParentNode = document) =>
    [...root.querySelectorAll<HTMLElement>("*")].filter(
        el => el.textContent?.trim() === text && [...el.children].every(c => c.textContent?.trim() !== text),
    );

/** The button whose label (text or aria-label) is name. */
export const button = (name: string | RegExp, root: ParentNode = document) =>
    [...root.querySelectorAll<HTMLButtonElement>("button")].find(b => {
        const label = (b.getAttribute("aria-label") ?? b.textContent ?? "").trim();
        return typeof name === "string" ? label === name : name.test(label);
    }) ?? null;
