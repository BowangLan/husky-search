import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const seedFeatures = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if features already exist
    const existingFeatures = await ctx.db.query("features").collect();

    if (existingFeatures.length > 0) {
      console.log("Features already exist, skipping seed");
      return;
    }

    // Add sample features
    const features = [
      {
        name: "Course Comparison Tool",
        status: "in-development" as const,
        description: "Compare multiple courses side-by-side to help you make better decisions about which classes to take.",
      },
      {
        name: "Email Notifications",
        status: "in-consideration" as const,
        description: "Get notified when a course opens up or when there are changes to your schedule.",
      },
      {
        name: "GPA Calculator",
        status: "in-development" as const,
        description: "Calculate your projected GPA based on your planned courses and estimated grades.",
      },
      {
        name: "Mobile App",
        status: "in-consideration" as const,
        description: "Native iOS and Android apps for easier access to course information on the go.",
      },
    ];

    for (const feature of features) {
      await ctx.db.insert("features", feature);
    }

    console.log(`Seeded ${features.length} features`);
  },
});
