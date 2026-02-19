import NormalizedFetch from "./normalizedFetch.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * WordPress Content Sync Utility
 * Can be called manually or triggered by webhooks
 */

export async function syncAndBuild() {
  console.log("🔄 Starting WordPress sync and build process...");
  
  try {
    // 1. Test WordPress connection
    console.log("📡 Testing WordPress connection...");
    const testData = await NormalizedFetch("posts", "per_page=1");
    
    if (!testData || Object.keys(testData).length === 0) {
      throw new Error("No data received from WordPress");
    }
    
    console.log("✅ WordPress connection successful");
    
    // 2. Trigger 11ty build (which will fetch fresh data)
    console.log("🔨 Building static site with fresh WordPress data...");
    const { stdout, stderr } = await execAsync("pnpm run build");
    
    console.log("✅ Build completed successfully");
    if (stderr) console.warn("Build warnings:", stderr);
    
    return {
      success: true,
      message: "Sync and build completed successfully",
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error("❌ Sync and build failed:", error.message);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// CLI usage
if (process.argv.length > 2 && process.argv[2] === "sync") {
  console.log("🚀 Manual sync triggered from CLI");
  syncAndBuild().then(result => {
    console.log(result);
    process.exit(result.success ? 0 : 1);
  });
}