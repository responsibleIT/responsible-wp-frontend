import NormalizedFetch from "../utils/normalizedFetch.js";

export default async function (eleventyData) {
  console.log("Fetching home data...");
  const home = await NormalizedFetch("frontpage", "");
  const pages = await NormalizedFetch("pages", "");

  const content = {
    home,
    pages
  }
  return content;
}