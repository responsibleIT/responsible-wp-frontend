import express from "express";
import { Liquid } from "liquidjs";
import path from "path";
import "dotenv/config";
import compression from "compression";
import NormalizedFetch from "../utils/normalizedFetch.js";
import { syncAndBuild } from "../utils/syncAndBuild.js";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import sanitize from "../lib/filters/sanitize.js";

const execAsync = promisify(exec);

// Only build on server start in development
const isDevelopment = process.env.ENVIRONMENT === "development";

// Development-only auto-build functionality
let buildStatic = null;
if (isDevelopment) {
  buildStatic = async function () {
    console.log("🔨 Building static site...");
    try {
      const { stdout, stderr } = await execAsync("pnpm run build");
      console.log("✅ Build completed successfully");
      if (stderr) console.warn("Build warnings:", stderr);
      return true;
    } catch (error) {
      console.error("❌ Build failed:", error.message);
      return false;
    }
  };
}

const shouldBuildOnStart = isDevelopment;

// Async startup function
async function startServer() {
  if (shouldBuildOnStart) {
    console.log("🚀 [DEV] Building fresh content...");
    await buildStatic();
  } else {
    console.log(
      "🚀 [LIVE] Server starting (build should be done during deployment)",
    );
  }

  const app = express();
  app.use(compression()); // ADD THIS - Fixes the flash by sending data faster

  const engine = new Liquid({
    root: [
      path.join(process.cwd(), "src/views"),
      path.join(process.cwd(), "src/views/partials"), // Add partials directory to search paths
      path.join(process.cwd(), "src/views/layouts"), // Add layouts directory to search paths
    ],
    extname: ".liquid",
  });

  // Register filters for SSR (same as 11ty)
  engine.registerFilter("sanitize", sanitize);

  app.engine("liquid", engine.express());
  app.set("view engine", "liquid");
  app.set("views", path.join(process.cwd(), "src/views/SSR"));

  const distPath = path.join(process.cwd(), "dist");

  // Improved static serving
  app.use(
    express.static(distPath, {
      maxAge: isDevelopment ? 0 : "1h", // Disable caching in development
    }),
  );

  // Perhaps we could cause rebuilds on demand via a webhook from WordPress? This would be more efficient than rebuilding the docker container on every change.
  app.post("/webhook/wordpress", async (req, res) => {
    console.log("🪝 WordPress webhook received:", req.body);
    const result = await syncAndBuild();
    res.json(result);
  });

  // Health check endpoint that shows environment and build status
  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      environment: process.env.ENVIRONMENT || "unknown",
      server: "running",
      autoBuilds: shouldBuildOnStart,
      distExists: fs.existsSync(distPath),
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/projecten", async (req, res) => {
    const projectID = 27; // Project ID in WP
    const baseParam = "slug=projecten";
    const queryParams = new URLSearchParams(req.query).toString();
    
    let additionalOptions;
    const queryCheck = !(Object.keys(req.query).length === 0);
    if (queryCheck) {
      additionalOptions = `_fields=id,title,slug,date,modified,acf&parent=${projectID}`;
    }
    const options = queryParams ? `${queryParams}&${additionalOptions}` : baseParam;
    console.log(options);

    try {
      const data = await NormalizedFetch("pages", options);

      const filtered = queryParams ? true : false;
      // console.log(data);
      
      res.render("projecten", {
        data,
        filters: req.query,
        site: { title: "Responsible WP", filtered },
      });
    } catch (err) {
      console.error("SSR Error:", err);
      res.status(500).send("Server Error");
    }
  });

  const port = process.env.PORT || 3000;
  app.listen(port, "0.0.0.0", () => {
    console.log(
      `Project draait via port ${isDevelopment ? "http://localhost:" : ""}${port}`,
    );
  });
}

// Start the server
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
