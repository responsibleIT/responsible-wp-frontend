import express from "express";
import { Liquid } from "liquidjs";
import path from "path"; // Just use it for the initial setup to be safe
import "dotenv/config";

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


// The Route
app.get("/projecten", async (req, res) => {
  console.log("Booting SSR server.js...");
    // Manually fetch your data here
    const projectData = []; 

    res.render("projecten", {
        projects: projectData,
        filters: req.query,
        site: { title: "Responsible WP" }
    });
});

app.use(express.static("dist"));


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Project draait via http://localhost:${port}/`);
});