import { internalMutation } from "./_generated/server";

export const resetData = internalMutation({
    args: {},
    handler: async (ctx) => {
        // List of all tables to clear
        const tables = [
            "users",
            "services",
            "transactions",
            "invoices",
            "notifications",
            "automations",
            "emailConnections",
            "discounts"
        ];

        for (const table of tables) {
            const documents = await ctx.db.query(table as any).collect();
            for (const doc of documents) {
                await ctx.db.delete(doc._id);
            }
        }

        console.log("Database reset complete.");
        return { success: true };
    },
});
