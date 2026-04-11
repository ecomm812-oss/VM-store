module.exports = {
  datasource: {
    // Keep Prisma CLI and app runtime on the same database.
    // Falling back to SQLite can cause "data not showing" when app reads Postgres.
    url: process.env.DATABASE_URL || process.env.DIRECT_URL || "file:./dev.db"
  },
}


