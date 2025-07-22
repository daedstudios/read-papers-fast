// Simple test to verify database schema
const { PrismaClient } = require("./lib/generated/prisma");

const prisma = new PrismaClient();

async function testSchema() {
  try {
    // Create a test fact-check session
    const testSession = await prisma.factCheckSession.create({
      data: {
        statement: "Test statement",
        keywords: ["test"],
        finalVerdict: null,
        papers: {
          create: [
            {
              externalId: "test-id",
              title: "Test Paper",
              authors: ["Test Author"],
              summary: "Test summary",
              published: "2024-01-01",
              preEvalVerdict: "supports",
              preEvalSummary: "Test pre-eval summary",
              preEvalSnippet: "Test snippet",
            },
          ],
        },
      },
      include: {
        papers: true,
      },
    });

    console.log(
      "✅ Successfully created test session with pre-evaluation data:"
    );
    console.log(JSON.stringify(testSession, null, 2));

    // Clean up
    await prisma.factCheckSession.delete({
      where: { id: testSession.id },
    });

    console.log("✅ Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSchema();
