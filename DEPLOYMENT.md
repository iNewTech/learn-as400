# Publishing learn-as400

The Netlify site uses a static Vite build. The Sites/Vinext development scaffold is also retained; Netlify does not require a Worker or IBM i backend.

## GitHub

The repository is named `learn-as400`. For a fresh authorized account with no existing remote:

```sh
gh auth login
git init -b main
git add .
git commit -m "Build learn-as400 interview study guide"
gh repo create learn-as400 --public --source=. --remote=origin --push
```

If the repository already exists, use the configured remote and push normally rather than creating another repository.

## Netlify

`netlify.toml` sets `npm run build:netlify` and the publish directory `netlify-dist`.

```sh
npm ci
npm run build:netlify
npx netlify-cli login
npx netlify-cli link
npx netlify-cli deploy --prod --dir=netlify-dist
```

For a new project, replace the link step with:

```sh
npx netlify-cli sites:create --name learn-as400
```

No credentials are committed. The CLI keeps its local project link in the ignored `.netlify/` folder. To enable automatic deploys, connect the GitHub repository to this existing Netlify project in Netlify’s repository settings, select `main`, and retain the build/publish settings above. Manual deployment alone does not establish GitHub-triggered builds.

## Chapter links and storage

The website uses stable hash links such as `/#files-operations`, so static hosting requires no server-side route fallback. Browser progress belongs to the current origin; switching from localhost to Netlify or between hostnames starts a separate progress store. Clearing browser site data removes progress.

## Release checklist

Run tests, typecheck, lint, regenerate Markdown if content changed, and build the static site. Commit and push the validated source, then deploy that build. Verify the returned production URL and its JavaScript/CSS assets. Keep the previous successful Netlify deployment available for rollback.

## Sites mirror

For the retained Sites hosting configuration, run `npm run build:sites`. This prepares the same static assets in `out/`, the directory declared in `.openai/hosting.json`. Netlify continues to use `netlify-dist/`.
