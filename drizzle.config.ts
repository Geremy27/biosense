import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./app/db/migrations", // Where your SQL migration history files will be saved
  schema: "./app/db/schema.ts", // The path to the schema file containing your Better-Auth tables
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!, // Pulls the connection string from your local .env file
  },
});
