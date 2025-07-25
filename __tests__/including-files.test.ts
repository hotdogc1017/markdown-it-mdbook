import { test, expect, describe } from "vitest";
import {
  INCLUDE_RE,
  syntaxMatcher,
  findLines,
  findLinesWithAnchor,
  includingFilesPlugin,
} from "../src/including-files";
import MarkdownIt from "markdown-it";
import fs from "node:fs";
import path from "node:path";

describe("Regexp and utils tests", () => {
  test("regexp test", () => {
    /* prettier-ignore */
    const SYNTAX_SOURCES = {
      "{{#include file.rs:2}}": ["file.rs", "rs", undefined, ":2", undefined],
      "{{#include file.rs::10}}": ["file.rs", "rs", undefined, ":", ":10"],
      "{{#include file.rs:2:}}": ["file.rs", "rs", undefined, ":2", ":"],
      "{{#include file.rs:2:10}}": ["file.rs", "rs", undefined, ":2", ":10"],
      "{{#include file.rs:anchor}}": ["file.rs", "rs", "anchor", undefined, undefined],
      " {{#include file.rs:anchor}}": ["file.rs", "rs", "anchor", undefined, undefined],
    };
    for (const [source, expectedValue] of Object.entries(SYNTAX_SOURCES)) {
      const [, ...value] = [...(source.match(INCLUDE_RE) ?? [])];
      expect(value).toEqual(expectedValue);
    }
  });

  test("syntax matcher test", () => {
    expect(syntaxMatcher("{{#include file.rs:2}}")).toEqual({
      filepath: "file.rs",
      lang: "rs",
      anchor: undefined,
      startLine: "2",
      endLine: "2",
      excludeMode: false,
    });
    expect(syntaxMatcher("{{#include file.rs::10}}")).toEqual({
      filepath: "file.rs",
      lang: "rs",
      anchor: undefined,
      startLine: "0",
      endLine: "10",
      excludeMode: false,
    });
    expect(syntaxMatcher("{{#include file.rs:2:}}")).toEqual({
      filepath: "file.rs",
      lang: "rs",
      anchor: undefined,
      startLine: "0",
      endLine: "1",
      excludeMode: true,
    });
    expect(syntaxMatcher("{{#include file.rs:2:10}}")).toEqual({
      filepath: "file.rs",
      lang: "rs",
      anchor: undefined,
      startLine: "2",
      endLine: "10",
      excludeMode: false,
    });
    expect(syntaxMatcher("{{#include file.rs:anchor}}")).toEqual({
      filepath: "file.rs",
      lang: "rs",
      anchor: "anchor",
      startLine: undefined,
      endLine: undefined,
      excludeMode: false,
    });
  });

  /* prettier-ignore */
  test("find lines test", () => {
    const filepath = path.resolve(import.meta.dirname, "fixtures", "including_files.rs")
    const lines = fs.readFileSync(filepath, { encoding: "utf8" }).split("\n")
    expect(findLines(lines, 1, 4)).toMatchSnapshot();
    expect(findLines(lines, 2, 3, true)).toMatchSnapshot();
  });

  /* prettier-ignore */
  test("find lines with anchor test", () => {
    const filepath = path.resolve(import.meta.dirname, "fixtures", "including_files_with_anchor.rs")
    const lines = fs.readFileSync(filepath, { encoding: "utf8" }).split("\n")
    expect(findLinesWithAnchor(lines, "component")).toMatchSnapshot();
    expect(findLinesWithAnchor(lines, "system")).toMatchSnapshot();
    expect(findLinesWithAnchor(lines, "all")).toMatchSnapshot();
  });
});

describe("including-files plugin test", () => {
  const testSourceFilepath = path.resolve(
    import.meta.dirname,
    "fixtures",
    "including-files.md",
  );
  const source = fs.readFileSync(testSourceFilepath, { encoding: "utf8" });
  test("output html without the `cwd` in env", () => {
    const md = new MarkdownIt({ html: true });
    md.use(includingFilesPlugin);
    const html = md.render(source);
    expect(html).toMatchSnapshot();
  });

  test("output html with the `cwd` in env", () => {
    const md = new MarkdownIt({ html: true });
    md.use(includingFilesPlugin);
    const html = md.render(source, { cwd: testSourceFilepath });
    expect(html).toMatchSnapshot();
  });
});
