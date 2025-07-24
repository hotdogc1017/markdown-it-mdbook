/**
 * With the exception of the test directory, nearly all the code is sourced from https://github.com/mdit-plugins/mdit-plugins/tree/main/packages/include/src
 * modified only to change the regular expression for the include syntax
 * A heartfelt thank you to all the owners and contributors of the original project
 *
 * 几乎所有代码（除测试目录内的代码以外）都来自于https://github.com/mdit-plugins/mdit-plugins/tree/main/packages/include/src
 * 仅仅修改了包含语法规则应用时的正则表达式
 * 向此项目的所有者&贡献者表示诚挚的感谢
 */

import fs from "node:fs";
import path from "node:path";

import { NEWLINE_RE, dedent } from "@mdit/helper";
import type { PluginWithOptions } from "markdown-it";
import type { RuleBlock } from "markdown-it/lib/parser_block.mjs";
import type { RuleCore } from "markdown-it/lib/parser_core.mjs";
import type Token from "markdown-it/lib/token.mjs";

export interface MarkdownItIncludeOptions {
  currentPath: (env: IncludeEnv) => string;
  resolvePath?: (path: string, cwd: string | null) => string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface IncludeEnv extends Record<string, any> {
  /** included current paths */
  includedPaths?: string[];
  /** included files */
  includedFiles?: string[];
}

interface ImportFileLineInfo {
  filePath: string;
  lineStart?: number;
  lineEnd?: number;
}

interface ImportFileRegionInfo {
  filePath: string;
  region: string;
}

type ImportFileInfo = ImportFileLineInfo | ImportFileRegionInfo;

interface IncludeInfo {
  cwd: string | null;
}

/**
 * Rust needs to be supported for now.
 */
const REGIONS_RE = [
  /^\/\/ ?#?(ANCHOR(?:_END)?):\s*([\w_-]+)$/, // javascript, typescript, java
  /^\/\* ?#(ANCHOR(?:_END)?):\s*([\w_-]+) ?\*\/$/, // css, less, scss
  /^#pragma (ANCHOR(?:_END)?):\s*([\w_-]+)$/, // C, C++
  /^<!-- #?(ANCHOR(?:_END)?):\s*([\w_-]+) -->$/, // HTML, markdown
  /^#(ANCHOR(?:_END )):\s*([\w_-]+)$/, // Visual Basic
  /^::#(ANCHOR(?:_END)):\s*([\w_-]+)$/, // Bat
  /^# ?(ANCHOR(?:_END)?):\s*([\w_-]+)$/, // C#, PHP, Powershell, Python, perl & misc
  /^\/\/+\s?(ANCHOR(?:_END)?):\s*([\w_-]+)$/, // Rust
  /^\/\*\s?(ANCHOR(?:_END)?):\s*([\w_-]+)$/, // Rust
];

// regexp to match the import syntax
export const INCLUDE_RE =
  /^(\s*)\{{2}#include\s([^<>|:"*?]+(?:\.[a-z0-9]+)):?([a-zA-Z]+)?(?:(\d+)?:?(\d+)?)?\}{2}\s*$/m;

const testLine = (
  line: string,
  regexp: RegExp,
  regionName: string,
  end = false,
): boolean => {
  const [full, tag, name] = regexp.exec(line.trim()) ?? [];
  return Boolean(
    full &&
      tag &&
      name === regionName &&
      tag.match(end ? /^ANCHOR_END$/ : /^ANCHOR$/),
  );
};

const findRegion = (
  lines: string[],
  regionName: string,
): { lineStart: number; lineEnd: number } | null => {
  let regexp = null;
  let lineStart = -1;

  for (const [lineId, line] of lines.entries())
    if (regexp === null) {
      for (const reg of REGIONS_RE)
        if (testLine(line, reg, regionName)) {
          lineStart = lineId + 1;
          regexp = reg;
          break;
        }
    } else if (testLine(line, regexp, regionName, true)) {
      return { lineStart, lineEnd: lineId };
    }

  return null;
};

export const handleInclude = (
  info: ImportFileInfo,
  { cwd }: IncludeInfo,
): string => {
  const { filePath } = info;
  let realPath = filePath;

  if (!path.isAbsolute(filePath)) {
    // if the importPath is relative path, we need to resolve it
    // according to the markdown filePath
    if (!cwd) {
      console.error(`Error when resolving path: ${filePath}`);

      return "\nError when resolving path\n";
    }

    realPath = path.resolve(cwd, filePath);
  }

  if (!fs.existsSync(realPath)) {
    console.error(`${realPath} not found`);
    return "\nFile not found\n";
  }

  // read file content and split lines
  const lines = fs
    .readFileSync(realPath, { encoding: "utf-8" })
    .replace(NEWLINE_RE, "\n")
    .split("\n");
  let results: string[] = [];

  if ("region" in info) {
    const region = findRegion(lines, info.region);
    if (region) {
      const { lineStart, lineEnd } = region;
      results = lines.slice(lineStart, lineEnd);
    }
  } else {
    const { lineStart, lineEnd } = info;
    if (lineStart) {
      results = lines.slice(lineStart - 1, lineEnd);
    } else {
      results = lines.slice(0, lineEnd);
    }
  }

  if (realPath.endsWith(".md")) {
    const dirName = path.dirname(realPath);

    results.unshift(`<!-- #include-env-start: ${dirName} -->`);
    results.push("<!-- #include-env-end -->");
  }

  return dedent(results.join("\n").replace(/\n?$/, "\n"));
};

export const resolveInclude = (content: string, { cwd }: IncludeInfo): string =>
  content.replaceAll(
    INCLUDE_RE,
    (
      _,
      indent: string,
      includePath: string,
      region?: string,
      lineStart?: string,
      lineEnd?: string,
    ) => {
      if (!region && !lineStart && !lineEnd) {
        throw new Error(`Syntax error: Missing lineStart or lineEnd`);
      } else if (!path.isAbsolute(cwd)) {
        throw new Error(`Require the <cwd> option is an absolute path`);
      }
      const actualPath = path.resolve(cwd, includePath);
      const content = handleInclude(
        {
          filePath: actualPath,
          ...(region
            ? { region }
            : {
                ...(lineStart ? { lineStart: Number(lineStart ?? "0") } : {}),
                ...(lineEnd ? { lineEnd: Number(lineEnd ?? "0") } : {}),
              }),
        },
        { cwd },
      );

      return content
        .split("\n")
        .map((line) => indent + line)
        .join("\n");
    },
  );
