# SEO and indexing

The website publishes readable HTML at real URLs as well as the interactive hash routes. Search visitors can use the static guide and follow its practice link to the same browser-local checkpoints. Both versions come from the same content files.

- [Topic library](https://learn-as400.netlify.app/topics/): links to every tutorial, chapter, SQL reference, and blog page.
- [Sitemap](https://learn-as400.netlify.app/sitemap.xml): generated during each Netlify build.
- [Robots policy](https://learn-as400.netlify.app/robots.txt): allows crawling and points to the sitemap.

Each reader page has a unique title and description, a self-canonical URL, and breadcrumb structured data. Expanded lessons have truthful update dates. The build checks the published HTML, internal links, metadata, and anchor targets.

## Google Search Console

1. Open the URL-prefix property for `https://learn-as400.netlify.app/`. Use this exact HTTPS address; a `netlify.app` subdomain cannot be managed as your own DNS zone.
2. Complete ownership verification with the existing HTML file or verification meta tag if the property is not yet verified.
3. Under **Sitemaps**, submit `sitemap.xml`.
4. Use **URL Inspection** for the topic library and the updated guides below. Run the live test, then request indexing where available.
5. Review **Page indexing** for exclusions and **Performance → Search results** for actual queries, impressions, clicks, and pages. Compare trends over time rather than checking one personal search result.

Useful URLs to inspect first:

- `https://learn-as400.netlify.app/topics/`
- `https://learn-as400.netlify.app/learn/rpg-development/`
- `https://learn-as400.netlify.app/learn/db2-for-i/`
- `https://learn-as400.netlify.app/learn/data-and-files/`
- `https://learn-as400.netlify.app/learn/ile-application-design/`
- `https://learn-as400.netlify.app/learn/jobs-and-cl/`

Do not submit `/#learn/...` fragments as separate pages. The sitemap contains their readable URL counterparts. Search Console submission requires the verified owner's account and is separate from deploying the site; this repository does not claim that it has been submitted.

## Content maintenance

Add useful examples, expected results, failure cases, and official references to the existing topic before creating another page for a spelling variation such as AS400/AS/400/IBM i. Preserve lesson IDs and checkpoint IDs so updates retain browser progress. Change `updatedAt` only when that lesson's content changes materially.

Run `npm run docs`, `npm test`, and `npm run build:netlify` after content changes. Use the Search Console query data to choose the next topics readers need, and link new articles from the relevant guide and topic library.

These changes support discovery and understanding; they do not guarantee indexing or first position. See Google's [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) and [people-first content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).
