import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/SingletonPrismaClient";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { statement, keywords, finalVerdict, papers, analysisResults } = body;

    // Validate required fields
    if (!statement || !papers || !Array.isArray(papers)) {
      return NextResponse.json(
        { error: 'Missing required fields: statement, papers' },
        { status: 400 }
      );
    }

    // Create the fact-check session
    const factCheckSession = await prisma.factCheckSession.create({
      data: {
        statement,
        keywords: keywords || [],
        finalVerdict: finalVerdict || null,
        papers: {
          create: papers.map((paper: any) => ({
            externalId: paper.id,
            title: paper.title,
            authors: paper.authors || [],
            summary: paper.summary || null,
            published: paper.published || null,
            doi: paper.doi || null,
            journalName: paper.journal_name || null,
            publisher: paper.publisher || null,
            relevanceScore: paper.relevance_score || null,
            citedByCount: paper.cited_by_count || null,
            links: paper.links || null,
            // Pre-evaluation data
            preEvalVerdict: paper.pre_evaluation?.verdict || null,
            preEvalSummary: paper.pre_evaluation?.summary || null,
            preEvalSnippet: paper.pre_evaluation?.snippet || null,
            analysis: analysisResults?.[paper.id] ? {
              create: {
                pdfUrl: analysisResults[paper.id].pdfUrl || null,
                analysisMethod: analysisResults[paper.id].analysisMethod || null,
                supportLevel: analysisResults[paper.id].analysis?.support_level || null,
                confidence: analysisResults[paper.id].analysis?.confidence || null,
                summary: analysisResults[paper.id].analysis?.summary || null,
                relevantSections: analysisResults[paper.id].analysis?.relevant_sections || null,
                keyFindings: analysisResults[paper.id].analysis?.key_findings || [],
                limitations: analysisResults[paper.id].analysis?.limitations || [],
                error: analysisResults[paper.id].error || null,
              }
            } : undefined,
          })),
        },
      },
      include: {
        papers: {
          include: {
            analysis: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: factCheckSession.id,
      shareableId: factCheckSession.shareableId,
      message: 'Fact-check session saved successfully',
    });

  } catch (error) {
    console.error('Error saving fact-check session:', error);
    return NextResponse.json(
      { error: 'Failed to save fact-check session' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareableId = searchParams.get('shareableId');

    if (!shareableId) {
      return NextResponse.json(
        { error: 'shareableId is required' },
        { status: 400 }
      );
    }

    const factCheckSession = await prisma.factCheckSession.findUnique({
      where: { shareableId },
      include: {
        papers: {
          include: {
            analysis: true,
          },
        },
      },
    });

    if (!factCheckSession) {
      return NextResponse.json(
        { error: 'Fact-check session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: factCheckSession,
    });

  } catch (error) {
    console.error('Error retrieving fact-check session:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve fact-check session' },
      { status: 500 }
    );
  }
}
