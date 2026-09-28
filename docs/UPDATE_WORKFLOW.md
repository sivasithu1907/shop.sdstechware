# Update Workflow

How changes are delivered and applied to the repository after Baseline v1.

## 1. Baseline v1 (this delivery) — full replacement

Baseline v1 is delivered as one full project ZIP (`SDS-Techware-Shop-Baseline-v1.zip`, root folder `sds-techware-shop/`).

### Replacing the repository contents

1. Make sure your local copy is up to date and commit or stash any unrelated work.
2. Create a branch, e.g. `baseline-v1`.
3. **Delete these files/folders from the repository** (they were removed, moved or replaced in Baseline v1):

   | Remove | Reason / replacement |
   | --- | --- |
   | `bun.lock` | Replaced by `package-lock.json` (npm is the supported package manager) |
   | `src/context/StoreContext.tsx` (and the empty `src/context/` folder) | Replaced by `src/store/StoreContext.tsx` + hooks in `src/store/` |
   | `src/utils/searchFilter.ts` | Moved to `src/features/catalog/search.ts` |
   | `src/utils/generateQuotationPdf.ts` (and the empty `src/utils/` folder) | Moved to `src/features/quotation/generateQuotationPdf.ts` |
   | `src/assets/images/*.jpg` (and the empty `src/assets/` folder) | Moved to `public/images/products/` |

4. Copy **the contents** of the ZIP's `sds-techware-shop/` folder into the repository root (overwrite existing files).
5. Files that were **not** in the prototype ZIP (for example `.github/`, `LICENSE`, hosting config, an older `README.md`) are repository-specific. They were not inspected, so do not delete them blindly — review each one. Only `README.md` is intentionally overwritten by this baseline.
6. Run the checks:
   ```bash
   npm ci
   npm run verify      # typecheck + unit tests + production build
   ```
7. Review `git status` / `git diff --stat`, commit (e.g. "Baseline v1: organised, reproducible prototype"), push, and merge.
8. Tell Claude the commit hash of the merged baseline. Future updates are prepared against that commit.

**Rollback:** revert the baseline merge commit (`git revert -m 1 <merge-commit>`) or reset the branch to the previous commit. Browser data is migrated forward only: the previous prototype cannot read the new quotation-list and stock-history formats and may error on them. After a rollback, clear the site data in the browser (or use "Reset demo data") — export anything needed first.

## 2. Future updates — changed files only

After Baseline v1 is confirmed as uploaded, each update is delivered as a ZIP containing **only**:

- complete contents of every **modified** file,
- complete contents of every **new** file,
- all with their exact repository-relative paths (e.g. `src/features/catalog/pricing.ts`).

No snippets or partial files. No unchanged files.

Each update also includes a `CHANGE_MANIFEST.md` with:

| Section | Content |
| --- | --- |
| Base | Baseline version or repository commit hash the update was built on |
| Modified files | Path + one-line reason |
| New files | Path + one-line reason |
| Deleted files | Separate list of paths to delete |
| Renamed files | Separate list: old path → new path |
| Dependencies | Changes to `package.json`; the updated `package.json` and `package-lock.json` are included whenever dependencies change |
| Configuration / migration | Any config changes and browser-data or data migrations, with what happens to existing data |
| Verification | Commands to run and the results obtained before delivery (and what was not tested) |
| Rollback | How to undo this specific update |

Related documentation (`CHANGELOG.md`, `docs/PROJECT_HANDOVER.md`, this file) is updated and included whenever the change affects it.

### Applying an update

```bash
git checkout -b update-<name>
# delete the files listed under "Deleted files"
# move/rename files listed under "Renamed files"
# copy the ZIP contents into the repository root (overwrite)
npm ci            # always; required if package-lock.json changed
npm run verify
git add -A && git commit -m "<update name>"
```

### Rules for whoever prepares updates

- Work from the current baseline or the stated commit. If the current files are not available, ask for them (or a fresh ZIP) before editing — never reconstruct from an older copy.
- Keep business rules in `src/features/**` with unit tests; keep storage access in `src/lib/storage.ts`; keep business details in `src/config/business.ts`.
- Preserve storage keys, or ship a documented, non-destructive migration.
- Never describe an unrun check as passed.
