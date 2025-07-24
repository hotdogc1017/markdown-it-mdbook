import Renderer from "markdown-it/lib/renderer.mjs";
import StateBlock from "markdown-it/lib/rules_block/state_block.mjs";
import Token from "markdown-it/lib/token.mjs";

interface CreateBlockRuleParserOptions {
  ruleName: string;
  syntaxMatcher: (line: string) => unknown | null;
  originalArgs: ParserArgs;
  setToken?: (token: TokenWithMeta, match: unknown) => void;
}

export type ParserArgs = [StateBlock, number, number, boolean];
export type RenderArgs<T = any, E = any> = [
  TokenWithMeta<T>[],
  number,
  any,
  E,
  Renderer,
];

/**
 * Specify the type of meta in the token for content
 */
export type TokenWithMeta<T = any> = Token & { src: T };

/**
 * !!!NOTE: 仅适合创建不需要跨行解析的语法
 *
 * This func helps to quickly create a block rule and handles same edge cases automatically:
 * - When indent more than 3 spaces, it should be a code block.
 * - Skip if silent mode
 * - Auto increment line number
 * - Simplify params passing
 * - Manage rule name
 */
export function createBlockRuleParser({
  ruleName,
  syntaxMatcher,
  originalArgs,
  setToken,
}: CreateBlockRuleParserOptions) {
  const [state, startLine, endLine, silent] = originalArgs;
  const pos = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];

  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }
  if (silent) {
    return true;
  }
  const line = state.src.slice(pos, max);
  const match = syntaxMatcher?.(line);
  if (!match) {
    return false;
  }
  const token = state.push(ruleName, "", 1) as TokenWithMeta;
  token.map = [startLine, startLine + 1];
  token.src = match;
  setToken?.(token, match);

  state.line = startLine + 1;
  return true;
}
