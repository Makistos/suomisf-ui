// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// Every identity-style stylesheet (it imports the identity fonts). The admin SpeedDial's actions are links, so a page rule that
// colours every link turns their white icons link-blue: it happened on the person, work and short story trials (fixed 2026-11-25)
// and again on the publisher page (2026-11-27). These checks catch it in a new page before anyone sees it.
const root = join(__dirname, "..");
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : path.endsWith(".css") ? [path] : [];
});
const identity = files(root).filter(f => readFileSync(f, "utf8").includes("identity-fonts/fonts.css"));

describe("identity stylesheets", () => {
    it("are found", () => {
        expect(identity.length).toBeGreaterThanOrEqual(8);
    });

    it.each(identity.map(f => [relative(root, f), f]))("%s leaves the admin SpeedDial's links alone", (_name, file) => {
        const css = readFileSync(file, "utf8");
        // the page's root class defines its colour tokens (".pp { --pp-ink: … }"); only its link rule reaches the dial,
        // rules for parts of the page (".pp-crumbs a") don't
        const root = css.match(/^\.([\w-]+)\s*\{[^}]*--[\w-]+:/m)?.[1];
        expect(root, "the root class with the colour tokens").toBeTruthy();
        const plain = css.match(new RegExp(`^\\s*\\.${root} a(:hover|:focus-visible)?\\s*(,|\\{)`, "gm")) ?? [];
        expect(plain, `write the page's link rules as \`.${root} a:where(:not(.p-speeddial-action))\``).toEqual([]);
    });

    it.each(identity.map(f => [relative(root, f), f]))("%s sizes the admin SpeedDial where it places it", (_name, file) => {
        const css = readFileSync(file, "utf8");
        if (!/\.fixed-dial\s*\{[^}]*position:\s*fixed/.test(css)) return;
        // the size of the current page's button (3rem on person and work pages, PrimeReact's 4rem elsewhere);
        // tests/admin/identity-dial.spec.ts compares it with the current page
        expect(css, "add `.xx .fixed-dial .p-speeddial-button { width: …; height: …; }` as on the current page").toMatch(/\.fixed-dial \.p-speeddial-button\s*\{[^}]*width:\s*\d/);
    });
});
