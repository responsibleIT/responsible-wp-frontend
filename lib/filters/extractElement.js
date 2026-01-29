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

  // top-level = direct children of the root fragment
  const rootChildren = $.root().children();
  const match = rootChildren.filter(`.${className}`).first();

  return match.length ? $.html(match) : "";
};

export default extractElement;