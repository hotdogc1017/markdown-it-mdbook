import { hiddenCodeLinePlugin } from "./hidden-code-line";
import {
  includingFilesPlugin,
  IncludingFilesPluginOptions,
} from "./including-files";
import type { BookOptions } from "./types";
import MarkdownIt from "markdown-it";

export type MdBookPluginOptions = IncludingFilesPluginOptions & BookOptions;

export function mdBookPlugin(md: MarkdownIt, options?: MdBookPluginOptions) {
  md.use(hiddenCodeLinePlugin, options);
  md.use(includingFilesPlugin, options);
}
