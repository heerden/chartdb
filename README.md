![PFDDB Logo Light](public/logo-db-colour-small.png#gh-light-mode-only)
![PFDDB Logo Dark](public/logo-db-white-small.png#gh-dark-mode-only)

From your CI pipeline, create a visual database schema, editable and ready to evolve.

- Open-source database diagrams (ERD - Entity Relational Diagram) editor
- Integrates with your continuous integration pipeline
- Avoid ERD rot
- Cloud based
- Your database password remains with you!

[Try Now!](https://db.pfd.io?ref=github_readme) •
[Database Examples](https://db.pfd.io/examples?ref=github_readme)

---

## Licence

![PFDDB is released under the AGPL license](https://img.shields.io/github/license/heerden/pfddb?color=blue)

PFDDB is based on ChartDB and distributed under the same AGPL licence. 
We will regularly merge back core diagramming changes.

Current supported ChartDB version is `1.10.0`.

---

![Interface](public/pfddb.png)

### PFDDB

PFDDB is a powerful, web-based database diagramming editor and CI integration tool.
Instantly visualize your database schema with a single **"Smart Query."** Customize diagrams, export SQL scripts, and access all features—no account required. Experience seamless database design here.

**What it does**:

- **Instant Schema Import**
  Run a single query to instantly retrieve your database schema as JSON. This makes it incredibly fast to visualize your database schema, whether for documentation, team discussions, or simply understanding your data better.

- **AI-Powered Export for Easy Migration**
  Our AI-driven export feature allows you to generate the DDL script in the dialect of your choice. Whether you're migrating from MySQL to PostgreSQL or from SQLite to MariaDB, PFDDB simplifies the process by providing the necessary scripts tailored to your target database.
- **Interactive Editing**
  Fine-tune your database schema using our intuitive editor. Easily make adjustments or annotations to better visualize complex structures.

### Supported Databases

- PostgreSQL (<img src="./src/assets/postgresql_logo_2.png" width="15"/> + <img src="./src/assets/supabase.png" alt="Supabase" width="15"/> + <img src="./src/assets/timescale.png" alt="Timescale" width="15"/> )
- MySQL
- SQL Server
- MariaDB
- SQLite (<img src="./src/assets/sqlite_logo_2.png" width="15"/> + <img src="./src/assets/cloudflare_d1.png" alt="Cloudflare D1" width="15"/> Cloudflare D1)
- CockroachDB
- ClickHouse

## Try it in your continuous integration pipeline

1. Go to [https://db.pfd.io](https://db.pfd.io?ref=github_readme)
2. Click "Go to app"
3. Choose the database that you are using.
4. Take the magic query and run it in your database.
5. Copy and paste the resulting JSON set into PFDDB.
6. Enjoy Viewing & Editing!

## Getting Started

Use the [cloud version](https://db.pfd.io?ref=github_readme) or deploy locally:

### How To Use

```bash
npm install
npm run dev
```

### Build

```bash
npm install
npm run build
```
