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
  // ...your other configurations
})
```

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
