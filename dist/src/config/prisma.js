// Dynamic import to avoid TypeScript resolution issues
export async function getPrismaClient() {
    const { PrismaClient } = await import("../../../generated/client.js");
    return PrismaClient;
}
