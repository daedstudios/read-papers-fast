import React from "react";
import { prisma } from "@/lib/SingletonPrismaClient";
import Link from "next/link";

async function getRecentPapers() {
  // Get recent PaperMainStructure entries with their notes
  const mainStructures = await prisma.paperMainStructure.findMany({
    orderBy: {
      created_at: "desc",
    },
    take: 10,
    include: {
      PaperNotes: true, // Include related notes
    },
  });

  // Get all paperSummaryIDs from PaperContentGrobid that match our mainStructures
  const paperIds = mainStructures.map((structure) => structure.id);

  // Find all content entries for these paper IDs
  const contentEntries = await prisma.paperContentGrobid.findMany({
    where: {
      paperSummaryID: {
        in: paperIds,
      },
    },
    distinct: ["paperSummaryID"],
    select: {
      paperSummaryID: true,
      head: true,
    },
  });

  // Create a map for quick lookups
  const contentMap = new Map();
  contentEntries.forEach((entry) => {
    if (entry.paperSummaryID) {
      contentMap.set(entry.paperSummaryID, entry);
    }
  });

  // Find all PaperSummary entries that match our content paperSummaryIDs
  const validSummaryIds = contentEntries
    .map((entry) => entry.paperSummaryID)
    .filter((id) => id !== null) as string[];

  const paperSummaries =
    validSummaryIds.length > 0
      ? await prisma.paperSummary.findMany({
          where: {
            id: {
              in: validSummaryIds,
            },
          },
        })
      : [];

  // Create a map for quick lookups
  const summaryMap = new Map();
  paperSummaries.forEach((summary) => {
    summaryMap.set(summary.id, summary);
  });

  // Combine all the data
  return mainStructures.map((structure) => {
    const contentEntry = contentMap.get(structure.id);
    const paperSummary = contentEntry?.paperSummaryID
      ? summaryMap.get(contentEntry.paperSummaryID)
      : null;

    return {
      mainStructure: structure,
      paperSummary,
      hasMatch: !!paperSummary,
      notes: structure.PaperNotes || [],
      title:
        paperSummary?.title ||
        contentEntry?.head ||
        `Paper ID: ${structure.id.substring(0, 8)}...`,
    };
  });
}

const Page = async () => {
  const recentPapers = await getRecentPapers();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Recent Papers</h1>

      {recentPapers.length === 0 ? (
        <p>No recent papers found.</p>
      ) : (
        <div className="space-y-4">
          {recentPapers.map((paper) => (
            <div
              key={paper.mainStructure.id}
              className="border p-4 rounded shadow"
            >
              <h2 className="text-xl font-semibold">
                <Link
                  href={`/paperG?id=${paper.mainStructure.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {paper.title}
                </Link>
              </h2>

              {paper.paperSummary?.authors && (
                <p className="text-gray-600 mt-1">
                  Authors: {paper.paperSummary.authors.join(", ")}
                </p>
              )}

              <div className="flex justify-between mt-2">
                <p className="text-sm text-gray-500">
                  Added on:{" "}
                  {paper.mainStructure.created_at?.toLocaleDateString()}
                </p>

                {paper.notes.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Notes: {paper.notes.length}
                  </p>
                )}
              </div>

              {paper.mainStructure.pdf_file_path && (
                <p className="text-xs text-gray-400 mt-1 truncate">
                  File: {paper.mainStructure.pdf_file_path.split("/").pop()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Page;
