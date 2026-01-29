import express from "express";
import { Liquid } from "liquidjs";
import path, { normalize } from "path"; // Just use it for the initial setup to be safe
import "dotenv/config";
import NormalizedFetch from "../utils/normalizedFetch.js";

const app = express();
console.log("Booting SSR server.js...");
const engine = new Liquid({
  root: [
    path.join(process.cwd(), "src/views") // Set root to 'src'
  ],
  extname: ".liquid"
});

// Use the Liquid engine with Express
app.engine("liquid", engine.express());
app.set("view engine", "liquid");
// Point Express to the correct SSR views folder
app.set("views", path.join(process.cwd(), "src/views/SSR"));
const distPath = path.join(process.cwd(), 'dist');


// The Route
app.get("/projecten", async (req, res) => {
  console.log("accessing /projecten");
  
  const data = await NormalizedFetch("pages", "slug=projecten")
  console.log(data, "hi hello");
  
  res.render("projecten", {
    data,
    filters: req.query,
    site: { title: "Responsible WP" }
  });
});

app.use(express.static(distPath));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Project draait via http://localhost:${port}/`);
});