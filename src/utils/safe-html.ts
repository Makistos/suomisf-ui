import DOMPurify from 'dompurify';

/**
 * Props for dangerouslySetInnerHTML with the HTML sanitised first.
 *
 * Descriptions, bios and notes are stored as HTML written in the admin
 * editor (Quill, whose HTML export has a known XSS flaw with no fixed
 * release) and are shown to every visitor, so scripts, event handlers and
 * javascript: links are removed before rendering. Formatting and links
 * are kept.
 */
export const safeHtml = (html: string | null | undefined) => ({
    __html: html ? DOMPurify.sanitize(html) : '',
});
