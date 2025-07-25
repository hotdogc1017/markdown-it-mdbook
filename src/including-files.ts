import {
  createBlockRuleParser,
  type ParserArgs,
  type RenderArgs,
  type TokenWithMeta,
} from "./utils";
import MarkdownIt from "markdown-it";
import Token from "markdown-it/lib/token.mjs";
import path from "node:path";
import fs from "node:fs";

/**
 * Rust needs to be supported for now.
 *
 * Captures: [anchor_tag, anchor]
 */
const ANCHOR_RE_LIST = [
  /^\/\/+ #?(ANCHOR(?:_END)?): ([a-zA-Z]+)$/, // javascript, typescript, java, Rust
  /^\/\* ?#(ANCHOR(?:_END)?): ([a-zA-Z]+) ?\*\/$/, // css, less, scss
  /^#pragma (ANCHOR(?:_END)?): ([a-zA-Z]+)$/, // C, C++
  /^<!-- #?(ANCHOR(?:_END)?): ([a-zA-Z]+) -->$/, // HTML, markdown
  /^#(ANCHOR(?:_END )): ([a-zA-Z]+)$/, // Visual Basic
  /^::#(ANCHOR(?:_END)): ([a-zA-Z]+)$/, // Bat
  /^# ?(ANCHOR(?:_END)?): ([a-zA-Z]+)$/, // C#, PHP, Powershell, Python, perl & misc
  /^\/\* (ANCHOR(?:_END)?): ([a-zA-Z]+) \*\/$/, // Rust
];

/**
 * Captures: [filepath, lang, anchor, startLine, endLine]
 */
export const INCLUDE_RE =
  /^\s*\{{2}#include\s([^<>|:"*?]+(?:\.([a-z0-9]+)))(?::?([a-zA-Z]+))?(:\d*)?(:\d*)?\}{2}\s*$/;

export function includingFilesPlugin(md: MarkdownIt) {
  type MatchResult = ReturnType<typeof syntaxMatcher>;
  const ruleName = "fence";

  const setToken = (token: TokenWithMeta<MatchResult>, match: MatchResult) => {
    token.markup = "```";
    // TODO: Compatible vitepress
    token.info = `${match.lang}`;
    token.content = match.filepath;
  };

  const parser = (...args: ParserArgs) => {
    return createBlockRuleParser({
      ruleName,
      syntaxMatcher,
      originalArgs: args,
      setToken,
    });
  };

  const fenceRender = md.renderer.rules["fence"]!;
  const render = (...args: RenderArgs<MatchResult, { cwd: string }>) => {
    const [tokens, idx, , env] = args;
    const token = tokens[idx];
    const { src } = token;

    if (!src) {
      // try to parse again, if successful, set token and recursion
      const result = syntaxMatcher(token.content);
      if (result) {
        setToken(token, result);
        token.src = result;
        return render(...args);
      } else {
        return fenceRender(...args);
      }
    }

    if (!env?.cwd || !path.isAbsolute(env.cwd)) {
      console.warn(
        `[markdwon-it-mdBook] ${env.cwd} is not a valid path or absolute path`,
      );
      token.content = `[markdwon-it-mdBook] unresolved file: ${src.filepath}`;
      return fenceRender(...args);
    }

    const stat = fs.statSync(env.cwd);
    const filepath = path.join(
      stat.isDirectory() ? env.cwd : path.dirname(env.cwd),
      `./${src.filepath}`,
    );
    if (!fs.existsSync(filepath)) {
      // print absolute path for debugging
      console.warn(`[markdwon-it-mdBook] ${filepath} is not found`);
      token.content = `${src.filepath} is not found`;
      return fenceRender(...args);
    } else if (fs.statSync(filepath).isDirectory()) {
      console.warn(
        `[markdwon-it-mdBook] require file, but get a directory: ${src.filepath}`,
      );
      token.content = `require file, but get a directory: ${src.filepath}`;
      return fenceRender(...args);
    }
    const fileContent = fs.readFileSync(filepath, {
      encoding: "utf-8",
    });

    if (!src.anchor && !src.startLine && !src.endLine) {
      token.content = fileContent;
      return fenceRender(...args);
    }

    const includedLines = src.anchor
      ? findLinesWithAnchor(fileContent.split("\n"), src.anchor)
      : findLines(
          fileContent.split("\n"),
          src.startLine,
          src.endLine,
          src.excludeMode,
        );

    token.content = includedLines.join("\n");

    return fenceRender(...args);
  };

  md.block.ruler.before("paragraph", ruleName, parser);
  md.renderer.rules[ruleName] = render;
}

export function syntaxMatcher(line: string) {
  let [, filepath, lang, anchor, startLine, endLine] =
    INCLUDE_RE.exec(line.trim()) || [];

  if (!filepath) return null;

  // The lines between startLine and endLine will be excluded
  let excludeMode = false;
  if (!anchor) {
    if (startLine && startLine !== ":" && endLine === ":") {
      const start = parseInt(startLine.slice(1));
      startLine = ":";
      endLine = `:${start - 1}`;
      excludeMode = true;
    }
    startLine = startLine?.slice(1) || "0";
    // if endLine is undefined, it defaults to startLine, which will only import one line
    endLine = endLine?.slice(1) || startLine;
  }

  return {
    filepath,
    lang,
    anchor,
    startLine,
    endLine,
    excludeMode,
  };
}

export function findLinesWithAnchor(lines: string[], anchor: string) {
  let RE = null;
  const pos = { start: -1, end: -1 };

  lines.forEach((line, i) => {
    if (!RE) {
      const anchorRE = ANCHOR_RE_LIST.find((re) => re.test(line));
      const [, anchor_tag, anchor_name] = anchorRE?.exec(line) ?? [];
      if (!anchor_tag || anchor_name !== anchor) {
        return;
      } else {
        RE = anchorRE;
      }
    }

    const [_, tag, name] = RE.exec(line) ?? [];
    if (!tag || name !== anchor) {
      return;
    }

    if (!tag.endsWith("_END")) {
      pos.start = i + 1;
    } else if (tag.endsWith("_END") && pos.start >= 0) {
      pos.end = i;
    }
  });

  if (pos.start < 0 || pos.end < 0) {
    return [];
  }

  return lines.slice(pos.start, pos.end);
}

export function findLines(
  lines: string[],
  start: number | string,
  end: number | string,
  excludeMode?: boolean,
) {
  const startLine = parseInt(start.toString());
  const endLine = parseInt(end.toString());

  if (startLine < 0 || endLine < 0) {
    throw [];
  }

  if (excludeMode) {
    return [...lines.slice(0, startLine), ...lines.slice(endLine + 1)];
  }

  return lines.slice(startLine, endLine + 1);
}
