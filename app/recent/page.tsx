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

  // Batch query approach to reduce connection pool pressure
  // 1. Get all content entries for these paper IDs (for titles/headers)
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

  // Create a map for quick lookups of content headers
  const contentMap = new Map();
  contentEntries.forEach((entry) => {
    if (entry.paperSummaryID) {
      contentMap.set(entry.paperSummaryID, entry);
    }
  });

  // 2. Get paper summaries directly
  const summaries = await prisma.paperSummary.findMany({
    where: {
      paperSummaryID: {
        in: paperIds,
      },
    },
  });

  // Create maps for quick lookups
  const summaryMap = new Map();
  const paperSummaryMap = new Map();
  summaries.forEach((summary) => {
    summaryMap.set(summary.id, summary);
    if (summary.paperSummaryID) {
      paperSummaryMap.set(summary.paperSummaryID, summary);
    }
  });

  // 3. Get all content counts in one query
  const contentCounts = await prisma.paperContentGrobid.groupBy({
    by: ["paperSummaryID"],
    where: {
      paperSummaryID: {
        in: paperIds,
      },
    },
    _count: {
      id: true,
    },
  });

  // Create a map of content counts
  const contentCountMap = new Map();
  contentCounts.forEach((count) => {
    if (count.paperSummaryID) {
      contentCountMap.set(count.paperSummaryID, count._count.id);
    }
  });

  // 4. Get all figure counts in one query
  const figureCounts = await prisma.paperFigures.groupBy({
    by: ["paper_summary_id"],
    where: {
      paper_summary_id: {
        in: paperIds,
      },
    },
    _count: {
      id: true,
    },
  });

  // Create a map of figure counts
  const figureCountMap = new Map();
  figureCounts.forEach((count) => {
    if (count.paper_summary_id) {
      figureCountMap.set(count.paper_summary_id, count._count.id);
    }
  });

  // 5. Get all keyword counts in one query
  const keywordCounts = await prisma.acronym.groupBy({
    by: ["paperSummaryId"],
    where: {
      paperSummaryId: {
        in: paperIds,
      },
    },
    _count: {
      id: true,
    },
  });

  // Create a map of keyword counts
  const keywordCountMap = new Map();
  keywordCounts.forEach((count) => {
    if (count.paperSummaryId) {
      keywordCountMap.set(count.paperSummaryId, count._count.id);
    }
  });

  // 6. Get all reference counts in one query
  const referenceCounts = await prisma.reference.groupBy({
    by: ["paper_summary_id"],
    where: {
      paper_summary_id: {
        in: paperIds,
      },
    },
    _count: {
      id: true,
    },
  });

  // Create a map of reference counts
  const referenceCountMap = new Map();
  referenceCounts.forEach((count) => {
    if (count.paper_summary_id) {
      referenceCountMap.set(count.paper_summary_id, count._count.id);
    }
  });

  // 7. Get all notes counts in one query
  const notesCounts = await prisma.paperNotes.groupBy({
    by: ["paper_summary_id"],
    where: {
      paper_summary_id: {
        in: paperIds,
      },
    },
    _count: {
      id: true,
    },
  });

  // Create a map of notes counts
  const notesCountMap = new Map();
  notesCounts.forEach((count) => {
    if (count.paper_summary_id) {
      notesCountMap.set(count.paper_summary_id, count._count.id);
    }
  });

  // 8. Get all figure data counts in one query
  const figureDataCounts = await prisma.grobidFigureData.groupBy({
    by: ["paper_summary_id"],
    where: {
      paper_summary_id: {
        in: paperIds,
      },
    },
    _count: {
      id: true,
    },
  });

  // Create a map of figure data counts
  const figureDataCountMap = new Map();
  figureDataCounts.forEach((count) => {
    if (count.paper_summary_id) {
      figureDataCountMap.set(count.paper_summary_id, count._count.id);
    }
  });
  // Now build the stats for each paper without parallel queries
  const paperStats = paperIds.map((id) => {
    const grobidContentCount = contentCountMap.get(id) || 0;
    const hasAbstract = !!paperSummaryMap.get(id);
    const grobidFiguresCount = figureCountMap.get(id) || 0;
    const keywordsCount = keywordCountMap.get(id) || 0;
    const referencesCount = referenceCountMap.get(id) || 0;
    const notesCount = notesCountMap.get(id) || 0;
    const figuresDataCount = figureDataCountMap.get(id) || 0;

    return {
      paperId: id,
      stats: {
        grobidContentCount,
        hasAbstract,
        grobidFiguresCount,
        keywordsCount,
        referencesCount,
        notesCount,
        figuresDataCount,
        // Calculate overall completeness percentage
        completeness: calculateCompleteness(
          grobidContentCount,
          hasAbstract,
          grobidFiguresCount,
          keywordsCount,
          referencesCount
        ),
      },
    };
  });

  // Create a map for quick lookups of paper statistics
  const statsMap = new Map();
  paperStats.forEach((stat) => {
    statsMap.set(stat.paperId, stat.stats);
  });
  // Combine all the data
  return mainStructures.map((structure) => {
    const contentEntry = contentMap.get(structure.id);
    // Get paper summary directly from paperSummaryMap using the structure ID
    const paperSummary = paperSummaryMap.get(structure.id);
    const stats = statsMap.get(structure.id) || {
      grobidContentCount: 0,
      hasAbstract: false,
      grobidFiguresCount: 0,
      keywordsCount: 0,
      referencesCount: 0,
      notesCount: 0,
      figuresDataCount: 0,
      completeness: 0,
    };

    return {
      mainStructure: structure,
      paperSummary,
      hasMatch: !!paperSummary,
      notes: structure.PaperNotes || [],
      title:
        paperSummary?.title ||
        contentEntry?.head ||
        `Paper ID: ${structure.id.substring(0, 8)}...`,
      stats,
    };
  });
}

// Helper function to calculate completeness percentage
function calculateCompleteness(
  grobidContentCount: number,
  hasAbstract: boolean,
  figuresCount: number,
  keywordsCount: number,
  referencesCount: number
): number {
  let score = 0;
  const totalFactors = 5;

  // Content sections (weight: 1)
  if (grobidContentCount > 0) score += Math.min(1, grobidContentCount / 5);

  // Abstract (weight: 1)
  if (hasAbstract) score += 1;

  // Figures (weight: 1)
  if (figuresCount > 0) score += Math.min(1, figuresCount / 3);

  // Keywords (weight: 1)
  if (keywordsCount > 0) score += Math.min(1, keywordsCount / 5);

  // References (weight: 1)
  if (referencesCount > 0) score += Math.min(1, referencesCount / 5);

  return Math.round((score / totalFactors) * 100);
}

const Page = async () => {
  const recentPapers = await getRecentPapers();

  return (
    <div className="container mx-auto p-4 ">
      <h1 className="text-2xl font-bold mb-6 mt-24">Recent Papers</h1>

      {recentPapers.length === 0 ? (
        <p>No recent papers found.</p>
      ) : (
        <div className="space-y-4">
          {recentPapers.map(
            (paper) => (
              console.log("Paper:", paper),
              (
                <div
                  key={paper.mainStructure.id}
                  className="border p-4 rounded shadow"
                >
                  <h2 className="text-xl font-semibold">
                    <Link
                      href={`/paperC?id=${paper.mainStructure.id}`}
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

                  {/* Data statistics section */}
                  <div className="mt-4 bg-gray-50 p-3 rounded-md">
                    <h3 className="text-md font-medium mb-2">
                      Data Completeness: {paper.stats.completeness}%
                    </h3>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${paper.stats.completeness}%` }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">Content Sections</span>
                        <span
                          className={
                            paper.stats.grobidContentCount > 0
                              ? "text-green-600"
                              : "text-red-500"
                          }
                        >
                          {paper.stats.grobidContentCount}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Abstract</span>
                        <span
                          className={
                            paper.stats.hasAbstract
                              ? "text-green-600"
                              : "text-red-500"
                          }
                        >
                          {paper.stats.hasAbstract ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Figures</span>
                        <span
                          className={
                            paper.stats.grobidFiguresCount > 0
                              ? "text-green-600"
                              : "text-red-500"
                          }
                        >
                          {paper.stats.grobidFiguresCount}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Keywords</span>
                        <span
                          className={
                            paper.stats.keywordsCount > 0
                              ? "text-green-600"
                              : "text-red-500"
                          }
                        >
                          {paper.stats.keywordsCount}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">References</span>
                        <span
                          className={
                            paper.stats.referencesCount > 0
                              ? "text-green-600"
                              : "text-red-500"
                          }
                        >
                          {paper.stats.referencesCount}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Notes</span>
                        <span
                          className={
                            paper.stats.notesCount > 0
                              ? "text-green-600"
                              : "text-red-500"
                          }
                        >
                          {paper.stats.notesCount}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Figure Data</span>
                        <span
                          className={
                            paper.stats.figuresDataCount > 0
                              ? "text-green-600"
                              : "text-red-500"
                          }
                        >
                          {paper.stats.figuresDataCount}
                        </span>
                      </div>
                    </div>
                  </div>

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
              )
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Page;
