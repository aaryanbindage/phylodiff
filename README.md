# Phylodiff

Browse the NCBI tree of life (the taxonomy LifeMap draws) and compare any two taxa: 3D models side by side, plus a summary of how they differ in size, surface material and colour.

- `build-db.js` turns the NCBI taxonomy dump into `taxa.db` (SQLite, every node of the NCBI taxonomy, about 3 million taxa).
- `server.js` serves `public/` and a read-only API: `/api/children`, `/api/path`, `/api/search`, `/api/node`, `/api/stats`. No dependencies, needs Node 22.13 or newer (uses `node:sqlite`).
- `public/` is the front end. 18 species have hand-built models; every other taxon gets a model generated from its group's body plan, with illustrative sizes and colours.

## Run locally
```
curl -O https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/taxdump.tar.gz
tar -xzf taxdump.tar.gz nodes.dmp names.dmp
npm run build:db
npm start        # http://localhost:3000
```

## Deploy on Render
Push this folder to a GitHub repo, then in Render choose New > Blueprint and select it (`render.yaml`). The build step downloads the taxonomy and creates the database, so the first deploy takes a few minutes. The free plan sleeps when idle and wakes in about a minute.
