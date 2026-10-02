This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Local database (Docker)

`docker-compose.yml` runs Postgres 16 locally in a container named `fbolstats-db`. Create a `.env` with:

```
DATABASE_URL="postgresql://fbolstats:fbolstats@localhost:5432/fbolstats"
DIRECT_URL="postgresql://fbolstats:fbolstats@localhost:5432/fbolstats"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="choose-a-password"
```

Then start the database and load a data dump (ask the team for `fbolstats_db.sql`; it isn't committed):

```
docker compose up -d --wait
docker cp fbolstats_db.sql fbolstats-db:/tmp/fbolstats_db.sql
docker exec fbolstats-db psql -U fbolstats -d fbolstats -v ON_ERROR_STOP=1 -q -f /tmp/fbolstats_db.sql
```

To start with an empty database instead, run `npx prisma db push` after `docker compose up`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
