# Project Progress Dashboard

A static dashboard for tracking checklist completion, milestones, blockers, and evidence. The **Fictional Example Project** demonstrates the layout in light and dark modes.

## Start a project

1. On the template's GitHub page, choose **Use this template → Create a new repository**. Pick an owner, repository name, and visibility. [GitHub instructions](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template)
2. Clone your new repository and edit `site/project.json`. Replace the fictional content and set `isExample` to `false`. Configure the project name, headline, optional start date (YYYY-MM-DD), IANA time zone, current milestone and its readiness criteria, and current focus.
3. Give each planning area a unique ID and list those IDs in `sequence` in the order you want displayed. Use `dependencies` for blockers and `history` for dated milestone records. For each check, set its state to `resolved`, `open`, `deferred`, or `unverified`. Add an evidence note and, optionally, an HTTPS evidence link.

Each area divides its resolved checks by its total checks. Overall progress averages the area percentages equally and stays pending until every area has a nonempty checklist.

## Preview locally

With Node.js and Python 3 installed, run these commands from the repository root.

```sh
npm run build
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open [the local preview](http://127.0.0.1:4173). Run the build again after editing source files.

## Connect automatic updates

If your project tracks progress in this repository, treat `site/project.json` as the canonical checklist. Configure your host or CI to run `npm run build` and publish `dist/` when changes reach the default branch.

If another system is authoritative, configure a CI job to run on source changes or on a schedule. Have it read that system, map its records to the structure in `site/project.json`, write the generated file there before building, then publish `dist/`. Keep connector credentials in CI secrets and restrict dashboard hosting if the generated data is private. Everything in the published JSON is readable by dashboard visitors.

The dashboard reloads its deployed JSON when opened, when **Refresh** is clicked, and every minute while visible. Changes appear once the updated JSON is published.
