import Image from "@11ty/eleventy-img";
import { join } from "path";
import { rm } from "fs/promises";
import { existsSync } from "fs";
import sanitize from "./lib/filters/sanitize.js";
import extractElement from "./lib/filters/extractElement.js";

// ! .evelenty.js makes use of lib

export default function (eleventyConfig) {
  // Copy everything from public/ to /
  eleventyConfig.addPassthroughCopy({ "src/public/": "/" });

  // Ignore SSR-only templates; these are rendered by Express, not Eleventy
  // Paths are relative to the project root here
  eleventyConfig.ignores.add("src/views/SSR/**");

  // Remove project-visuals/ after build
  eleventyConfig.on("eleventy.after", async ({ dir }) => {
    const projectVisualsPath = join(dir.output, "assets", "img");

    if (existsSync(projectVisualsPath)) {
      await rm(projectVisualsPath, { recursive: true, force: true });
      console.log("Removed:", projectVisualsPath);
    }
  });

  eleventyConfig.addLiquidFilter("sanitize", sanitize);
  eleventyConfig.addLiquidFilter("extract", extractElement);

  // Image generation shortcode
  eleventyConfig.addLiquidShortcode(
    "image",
    async function (src, alt = "", sizes, loading = "lazy") {
      try {
        let metadata = await Image(src, {
          widths: [300, 600, 1200, 1600],
          formats: ["avif", "webp", "jpeg"],
          outputDir: "./dist/assets/img/",
          urlPath: "/assets/img/",
          transformOnRequest: false, // Disable image transformation
        });

        let imageAttributes = {
          alt,
          sizes: sizes || "(max-width: 768px) 100vw, 50vw",
          loading,
          decoding: "async",
        };
        // console.log(metadata, "created metadata");

        return Image.generateHTML(metadata, imageAttributes);
      } catch (error) {
        // handle missing images (empty image)
        // console.error(`Error processing image ${src}:`, error);
        return `<picture><img src="" alt="${alt ? alt : "Image not found"}" /></picture>`;
      }
    },
  );

  return {
    dir: {
      input: "src/views",
      includes: "partials",
      layouts: "layouts",
      // Note: `data` is resolved relative to `input`
      // `src/views` + `../../_data` → project root `_data`
      data: "../../_data",
      output: "dist",
    },
    templateFormats: ["liquid", "md", "html"],
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "liquid",
    passthroughFileCopy: true,
  };
}
