import AxeBuilder from '@axe-core/playwright';
import type { Result } from 'axe-core';
import { expect, Page } from '@playwright/test';

/**
 * Known violations that are not ours to fix, or are a decided trade-off.
 * Anything else axe finds fails the test.
 */
// PrimeReact 10's Menubar puts aria-level on role="menuitem" items, which
// ARIA doesn't allow there. Only that exact attribute on menu items is
// ignored; other aria-allowed-attr findings still fail.
function isMenubarAriaLevel(rule: Result, node: Result['nodes'][number]): boolean {
    if (rule.id !== 'aria-allowed-attr' || !node.html.includes('role="menuitem"')) return false;
    const disallowed = node.any.concat(node.all, node.none)
        .flatMap((check) => (Array.isArray(check.data) ? check.data : []));
    return disallowed.length > 0 && disallowed.every((attr: string) => attr.startsWith('aria-level='));
}

// The rich text editor (Quill, inside PrimeReact's Editor) renders its
// heading/size pickers as role="button" spans with no name.
function isQuillPicker(rule: Result, node: Result['nodes'][number]): boolean {
    return rule.id === 'aria-command-name' && node.html.includes('ql-picker-label');
}

// Links inside a line of text (e.g. the publisher in "Otava 1990") are told
// apart by colour alone: links have no resting underline, by decision, and
// indigo on grey text is 1.1:1 where WCAG wants 3:1. Open question, see
// tests/README.md.
const DISABLED_RULES = ['link-in-text-block'];

/** Run axe (WCAG 2.1 A + AA) on the page as it is now and fail on violations. */
export async function expectAccessible(page: Page, { include }: { include?: string } = {}) {
    // Mid-transition (a dialog fading in) text is translucent and fails the
    // colour contrast check; wait for animations to finish (endless ones,
    // like a spinner, never do and don't matter).
    await page.waitForFunction(() => document.getAnimations().every((a) =>
        a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity));
    let builder = new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .disableRules(DISABLED_RULES);
    if (include) builder = builder.include(include);
    const results = await builder.analyze();
    const violations = results.violations
        .map((rule) => ({ ...rule, nodes: rule.nodes.filter((node) =>
            !isMenubarAriaLevel(rule, node) && !isQuillPicker(rule, node)) }))
        .filter((rule) => rule.nodes.length > 0)
        .map((rule) => `${rule.id} (${rule.impact}): ${rule.help}\n` +
            rule.nodes.slice(0, 5).map((node) => `    ${node.target.join(' ')}  ${node.html.slice(0, 150)}`).join('\n'));
    expect(violations, `accessibility violations on ${page.url()}`).toEqual([]);
}
