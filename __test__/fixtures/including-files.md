{{#include including_files.rs:2}}
{{#include including_files.rs::10}}
{{#include including_files.rs:2:}}
{{#include including_files.rs:2:10}}

Here is a component:
```rust,no_run,noplayground
{{#include including_files_with_anchor.rs:component}}
```

Here is a system:
```rust,no_run,noplayground
{{#include including_files_with_anchor.rs:system}}
```

This is the full file.
```rust,no_run,noplayground
{{#include including_files_with_anchor.rs:all}}
```
