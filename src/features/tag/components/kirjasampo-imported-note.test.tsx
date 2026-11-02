// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import { KirjasampoImportedNote } from "./kirjasampo-imported-note";
import { cleanup, render } from "../../../test-utils/render";

afterEach(cleanup);

describe("KirjasampoImportedNote", () => {
    it("renders nothing when tags have never been imported", () => {
        expect(render(<KirjasampoImportedNote imported={null} />).textContent).toBe("");
        expect(render(<KirjasampoImportedNote />).textContent).toBe("");
    });

    it("shows the import date in Finnish format", () => {
        const container = render(<KirjasampoImportedNote imported="2026-10-29T18:59:54+00:00" />);
        expect(container.textContent).toBe("Tuotu Kirjasammosta 29.10.2026");
    });
});
