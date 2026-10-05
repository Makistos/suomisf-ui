// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { safeHtml } from './safe-html';

describe('safeHtml', () => {
    it('keeps formatting and ordinary links', () => {
        const html = '<p><strong>Lihavoitu</strong> ja <em>kursiivi</em>, '
            + '<a href="https://example.org/">linkki</a></p><ul><li>kohta</li></ul>';
        expect(safeHtml(html).__html).toBe(html);
    });

    it('removes scripts, event handlers and javascript: links', () => {
        const out = safeHtml('<p onclick="alert(1)">teksti</p><script>alert(2)</script>'
            + '<img src="x" onerror="alert(3)"><a href="javascript:alert(4)">linkki</a>').__html;
        expect(out).not.toMatch(/script|onclick|onerror|javascript:/i);
        expect(out).toContain('teksti');
    });

    it('treats missing values as empty', () => {
        expect(safeHtml(null).__html).toBe('');
        expect(safeHtml(undefined).__html).toBe('');
    });
});
