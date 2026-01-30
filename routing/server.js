import express from "express";
import { Liquid } from "liquidjs";
import path from "path";
import "dotenv/config";
import compression from "compression"; // ADD THIS
import NormalizedFetch from "../utils/normalizedFetch.js";

const app = express();
app.use(compression()); // ADD THIS - Fixes the flash by sending data faster

const engine = new Liquid({
  root: [path.join(process.cwd(), "src/views")],
  extname: ".liquid"
});

app.engine("liquid", engine.express());
app.set("view engine", "liquid");
app.set("views", path.join(process.cwd(), "src/views/SSR"));

const distPath = path.join(process.cwd(), 'dist');

// Improved static serving
app.use(express.static(distPath, {
  maxAge: '1h' // Helps with the "flash" on repeat visits
}));

app.get("/projecten", async (req, res) => {
  try {
    const data = await NormalizedFetch("pages", "slug=projecten");
    res.render("projecten", {
      data,
      filters: req.query,
      site: { title: "Responsible WP" }
    });
  } catch (err) {
    console.error("SSR Error:", err);
    res.status(500).send("Server Error");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => { // "0.0.0.0" is better for Docker
  console.log(`Project draait via port ${port}`);
});