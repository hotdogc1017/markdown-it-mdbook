import { hiddenCodeLinePlugin } from "./hidden-code-line";
import { includingFilesPlugin } from "./including-files";
import type { BookOptions } from "./types";
import MarkdownIt from "markdown-it";

export interface MdBookPluginOptions {
  bookOptions: BookOptions;
}

export function mdBookPlugin(md: MarkdownIt, options?: MdBookPluginOptions) {
  const { bookOptions } = options || {};
  md.use(hiddenCodeLinePlugin, bookOptions);
  md.use(includingFilesPlugin);
}
