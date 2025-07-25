import { test, expect, describe } from "vitest";
import { parseInfo, hiddenCodeLinePlugin } from "../src/hidden-code-line";
import path from "node:path";
import fs from "node:fs";
import MarkdownIt from "markdown-it";

describe("parseInfo", () => {
  test("test parseInfo", () => {
    expect(parseInfo("python,hidelines=!!!")).toMatchSnapshot();
  });

  test("test parseInfo with playground", () => {
    expect(parseInfo("python,hidelines=!!!,playground")).toMatchSnapshot();
  });

  test("test parseInfo with playground and hidelines", () => {
    expect(parseInfo("python,playground,hidelines=!!!")).toMatchSnapshot();
  });

  test("test parseInfo with nothing", () => {
    expect(parseInfo("python")).toMatchSnapshot();
  });
});

describe("no-hidden-code-line plugin", () => {
  test("test no-hidden-code-line plugin", () => {
    const filesPath = path.resolve(import.meta.dirname, "./fixtures");
    const hiddenCodeLineMd = fs.readFileSync(
      path.join(filesPath, "hidden-code-line.md"),
      { encoding: "utf-8" },
    );
    const noHiddenCodeLineMd = fs.readFileSync(
      path.join(filesPath, "no-hidden-code-line.md"),
      { encoding: "utf-8" },
    );
    const pluginRenderOutput = () => {
      const bookOptions = {
        output: {
          html: {
            code: {
              hidelines: { python: "~" },
            },
          },
        },
      };
      return new MarkdownIt()
        .use(hiddenCodeLinePlugin, bookOptions)
        .render(hiddenCodeLineMd);
    };
    const normalRenderOutput = () => {
      return new MarkdownIt().render(noHiddenCodeLineMd);
    };
    expect(pluginRenderOutput()).toBe(normalRenderOutput());
  });
});
