module.exports = {
  datasource: {
    // Use SQLite for development, PostgreSQL for production
    url: process.env.NODE_ENV === 'production'
      ? process.env.DATABASE_URL
      : "file:./dev.db"
  },
}


