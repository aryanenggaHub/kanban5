# Version 2 is served from /v2/ on the existing Pages site

GitHub Pages allows one site per repository, so a second page cannot live on its own URL. Version 2 lives in `v2/index.html` and the deploy publishes both the root `index.html` (version 1, unchanged) and `v2/`, so the version 1 link keeps working. A second repository would give a separate URL but split the history and CI, which we rejected.
