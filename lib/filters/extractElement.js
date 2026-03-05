import * as cheerio from "cheerio";

/**
 * Extract specific element from provided html by className
 * @param {any} html - content
 * @param {any} className - class of element we want to display
 * @returns {any}
 */
const extractElement = (html, className) => {
  if (!html || typeof html !== "string") return "";

  const $ = cheerio.load(html, null, false);

  const match = $(`.${className}`).first();

  return match.length ? $.html(match) : "";
};

export default extractElement;