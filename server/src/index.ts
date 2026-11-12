import { app } from "./app.js";
import { seedDatabase } from "./db/seed.js";

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    // Seed initial data if database is empty
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Liquor Distributor Server running on http://localhost:${PORT}`);
      console.log(`📡 Healthcheck: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

bootstrap();
