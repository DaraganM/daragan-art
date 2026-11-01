# Content guide

How to add work to the site without touching page code. Everything below is data plus image files.

## Image files

Put web-sized WebP files in `public/works/` (artwork) or `public/lab/` (figures for Lab projects). Name them `<slug>-<width>.webp`, for example `hms-sutherland-640.webp` and `hms-sutherland-1095.webp`. Use about 640 px for cards and one larger size, up to about 1200 px where the source allows. Never upscale a small source.

The build reads the sizes from the files themselves and fails with a clear message if a slug has no files, so a broken image reference cannot be deployed. Delete files that are no longer used, because everything in `public/` is deployed.

## Visual Thinking: `src/data/visual-thinking.json`

Categories live in `src/data/visual-thinking-categories.json`. A category without published works is not shown.

| Field | Required | Notes |
|---|---|---|
| `slug` | yes | Unique. Also the anchor `/visual-thinking/#slug`. |
| `title`, `category` | yes | `category` is an id from the categories file. |
| `image`, `imageAlt` | yes | `image` is a slug in `public/works/`. Describe what is drawn; no keyword stuffing. |
| `year`, `medium` | no | Leave out what you do not know. |
| `purpose` | no | One sentence: what the study was meant to understand. |
| `approach` | no | How the subject is structured in the drawing. Say only what is true. |
| `skills` | no | Short phrases. |
| `processImage`, `processImageAlt` | no | A second image showing the process. The alt text is required with it. |
| `githubUrl` | no | Only when code exists. |
| `relatedProjectUrl` | no | A related case study, for example `/lab/#slug`. |

An entry with `"draft": true` is a placeholder and is never rendered. Use `_todo` to say what is missing.

Aim for two or three works per category and do not repeat a work in several categories.

## Lab: `src/data/lab.json`

| Field | Required | Notes |
|---|---|---|
| `slug`, `title` | yes | `slug` is also the anchor `/lab/#slug`. |
| `ownership` | yes | `own`, `exploration` or `fork`. The label is always shown. |
| `projectType` | no | For example "Time-series classification". |
| `status` | no | Leave it out unless it is true. |
| `shortProblem`, `approach` | no | Plain description of the problem and the method. |
| `technologies` | no | List. |
| `results` | no | List of lines. Only results that can be reproduced from the repository. |
| `heroImage`, `heroImageAlt` | no | A figure in `public/lab/`. |
| `githubUrl`, `liveUrl`, `visualizationUrl` | no | Rendered as "View code on GitHub", "View live project" and "View case study". |
| `upstream` | forks | The original repository. The page shows a credit line. |
| `section` | no | `experiments` (default) or `visualization`. |

Rules:

- A fork must have `githubUrl` and `upstream`. The build fails otherwise.
- A fork is never presented as original work. Change `ownership` to `exploration` or `own` only when the repository contains substantial work of your own.
- Do not publish numbers, scores or results that the repository cannot reproduce.

## Cross-linking

- A visual case study is `https://daragan.art/visual-thinking/#<slug>`, a Lab project is `https://daragan.art/lab/#<slug>`.
- In a project's README, link to its Lab anchor ("View the visual case study on daragan.art"). In `lab.json`, set `githubUrl`, and set `visualizationUrl` to the matching Visual Thinking anchor when there is one.
- LinkedIn links to daragan.art and to the GitHub profile. The CV lists each selected project with two links: the case study and the code.
- Do not add GitHub links to artwork cards when no code exists.
