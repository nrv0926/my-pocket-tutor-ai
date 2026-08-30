import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * What you print is not what you browse. The pack has no navigation and no
 * feedback form, it carries a header saying whose plan it is, and the answer
 * key starts a new sheet — handing a student the answers with the questions
 * is the one mistake this page could make on her behalf.
 */
const client = readFileSync("app/print/[id]/PrintClient.tsx", "utf8");
const page = readFileSync("app/print/[id]/page.tsx", "utf8");
const css = readFileSync("app/globals.css", "utf8");

describe("the printable pack", () => {
  it("defaults to the lesson and the worksheet, not the answers", () => {
    expect(client).toMatch(/lesson: true/);
    expect(client).toMatch(/worksheet: true/);
    expect(client).toMatch(/key: false/);
  });

  it("always starts the answer key on a new page", () => {
    const keySection = client.slice(client.indexOf("parts.key &&"));
    expect(keySection).toMatch(/break-before-page/);
    expect(keySection).toMatch(/keep this sheet/i);
  });

  it("gives every level's worksheet its own sheet", () => {
    const wsSection = client.slice(
      client.indexOf("parts.worksheet &&"),
      client.indexOf("parts.key &&")
    );
    expect(wsSection).toMatch(/break-before-page/);
  });

  it("leaves room to write under each question", () => {
    expect(client).toMatch(/function WriteOn/);
    expect(client).toMatch(/border-b border-pop-night\/40/);
  });

  it("keeps the controls off the paper", () => {
    expect(client).toContain("print:hidden");
  });

  it("names the learner and when it was planned", () => {
    expect(client).toMatch(/\{learner\}/);
    expect(client).toMatch(/Planned/);
  });

  it("says how to get an actual file", () => {
    expect(client).toMatch(/Save as PDF/);
  });

  it("cannot print an empty page", () => {
    expect(client).toMatch(/const nothing = !parts\.lesson/);
    expect(client).toMatch(/disabled=\{nothing\}/);
  });

  it("reads the child through RLS rather than trusting the URL", () => {
    expect(page).toMatch(/from\("children"\)/);
    expect(page).toMatch(/notFound\(\)/);
  });
});

describe("the print stylesheet supports it", () => {
  it("defines the page break the pack relies on", () => {
    expect(css).toMatch(/\.break-before-page \{ break-before: page/);
  });

  it("prints the destination of a link, since paper has no clicking", () => {
    expect(css).toMatch(/a\[href\^="http"\]::after/);
  });

  it("still hides site chrome and the controls", () => {
    expect(css).toMatch(/body > header,/);
    expect(css).toMatch(/\.print\\:hidden \{ display: none/);
  });
});
