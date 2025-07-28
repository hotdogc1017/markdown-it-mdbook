# markdown-it-mdbook

A markdown-it plugin that implements specific features of mdBook

## Installation

```bash
npm install -D markdown-it-mdbook
```

## Usage

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { mdBookPlugin } from 'markdown-it-mdbook'

export default defineConfig({
  markdown: {
    config(md) {
      md.use(mdBookPlugin)
    }
  }
  // ...your configurations
})
```

The plugin supports the `book.toml` file, it will be used to configure the mdBook plugin.

> Currently, the plugin unsupport to parse the `book.toml` file directly, you can use the [smol-toml](https://github.com/squirrelchat/smol-toml) to parse toml file and pass the result to the plugin.

For example, you can configure a hidden prefix for a specific language:

```ts
const bookOptions = {
  output: {
    html: {
      code: {
        hidelines: { python: "~" }, // Use the `~` as the hidden prefix for Python.
      },
    },
  },
};

md.use(mdBookPlugin, bookOptions)
```


### Including files
If you want to use the **including-files** feature, you must specify the `cwd` option in the `env` parameter when calling the `md.render`.

Example:

```ts
md.render('{{# file.rs}}', { cwd: 'filepath/dir' })
```

You can also provide a path for resolving the reference file via the `getRelatedPath` function.

Using `Vitepress` as an example:

```ts
import { type MarkdownEnv } from "vitepress";

export default {
  // ...your other configurations
  markdown: {
    config(md) {
      md.use(mdBookPlugin, {
        getRelatedPath: (env: MarkdownEnv) => {
          const { realPath, path: _path } = env;
          return path.dirname(realPath ?? _path);
        },
      });
    },
  },
}
```

The cwd will be used to resolve the path of the reference file.

If render content without **including-files** feature, you can ignore it.

## Roadmap
- [x] Hiding code lines
- [ ] Rust Playground
- [ ] Rust code block attributes
- [x] Including files
- [x] Including portions of a file
- [x] Including a file but initially hiding all except specified lines
- [ ] Inserting runnable Rust files
- [ ] Controlling page title
- [ ] HTML classes provided by mdBook

The features listed above can be viewed in [mdBook](https://rust-lang.github.io/mdBook/format/mdbook.html)

Note: The feature list above is not in release order.
