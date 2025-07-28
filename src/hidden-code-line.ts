import MarkdownIt from "markdown-it";
import type { BookOptions } from "./types";

/**
 * prefix priority: local > global > default
 */
export function hiddenCodeLinePlugin(
  md: MarkdownIt,
  bookOptions?: BookOptions,
) {
  const globalPrefixMap: Record<string, string> = {
    rust: "#",
    ...getGloabalPrefixMap(bookOptions),
  };
  const originalRender = md.renderer.rules.fence!;
  md.renderer.rules.fence = (...args) => {
    const [tokens, idx] = args;
    const token = tokens[idx];
    const { lang, hidelines: localPrefix } = parseInfo(token.info);
    const globalPrefix = globalPrefixMap[lang];

    if (!localPrefix && !globalPrefix) {
      return originalRender(...args);
    }

    const prefix = localPrefix || globalPrefix;
    const RE = new RegExp(`^${prefix}.*`);
    const lines = token.content
      .split("\n")
      .filter((line) => !RE.test(line.trim()));
    token.info = `${lang}`;
    token.content = lines.join("\n");
    return originalRender(...args);
  };
}

export function parseInfo(info: string) {
  const [lang, ...attrs] = info.trim().split(",");
  const hidelinesStr = attrs.find((attr) => {
    const [key] = attr.split("=");
    return key.trim() === "hidelines";
  });

  if (!hidelinesStr) {
    return { lang };
  }

  const [, hidelines] = hidelinesStr.split("=");
  return { lang, hidelines };
}

function getGloabalPrefixMap(bookOptions?: BookOptions) {
  return bookOptions?.output?.html?.code.hidelines ?? {};
}
