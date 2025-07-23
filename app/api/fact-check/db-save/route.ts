import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/SingletonPrismaClient";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { statement, keywords, finalVerdict, papers, analysisResults } = body;

    console.log('Incoming request data:', {
      statement: statement?.length ? `${statement.substring(0, 50)}...` : 'missing',
      keywords: keywords?.length || 0,
      finalVerdict: finalVerdict ? 'present' : 'missing',
      papersCount: papers?.length || 0,
      analysisResultsCount: analysisResults ? Object.keys(analysisResults).length : 0
    });

    // Validate required fields
    if (!statement || !papers || !Array.isArray(papers)) {
      return NextResponse.json(
        { error: 'Missing required fields: statement, papers' },
        { status: 400 }
      );
    }

    // Shorten statement if too long (max 5000 characters)
    let processedStatement = statement;
    if (statement.length > 5000) {
      processedStatement = statement.substring(0, 5000);
      console.log(`Statement shortened from ${statement.length} to ${processedStatement.length} characters`);
    }

    // Validate and sanitize papers data
    const sanitizedPapers = papers.map((paper: any, index: number) => {
      try {
        return {
          externalId: paper.id || `paper_${index}`,
          title: paper.title || 'Untitled Paper',
          authors: Array.isArray(paper.authors) ? paper.authors : [],
          summary: typeof paper.summary === 'string' ? paper.summary : null,
          published: typeof paper.published === 'string' ? paper.published : null,
          doi: typeof paper.doi === 'string' ? paper.doi : null,
          journalName: typeof paper.journal_name === 'string' ? paper.journal_name : null,
          publisher: typeof paper.publisher === 'string' ? paper.publisher : null,
          relevanceScore: typeof paper.relevance_score === 'number' ? paper.relevance_score : null,
          citedByCount: typeof paper.cited_by_count === 'number' ? paper.cited_by_count : null,
          links: paper.links || null,
          // Pre-evaluation data
          preEvalVerdict: paper.pre_evaluation?.verdict || null,
          preEvalSummary: paper.pre_evaluation?.summary || null,
          preEvalSnippet: paper.pre_evaluation?.snippet || null,
        };
      } catch (error) {
        console.error(`Error sanitizing paper at index ${index}:`, error);
        throw new Error(`Invalid paper data at index ${index}`);
      }
    });

    // Sanitize keywords
    const sanitizedKeywords = Array.isArray(keywords) ? keywords.filter(k => typeof k === 'string') : [];

    // Sanitize finalVerdict
    let sanitizedFinalVerdict = null;
    if (finalVerdict && typeof finalVerdict === 'object') {
      try {
        // Ensure the finalVerdict can be serialized to JSON
        sanitizedFinalVerdict = JSON.parse(JSON.stringify(finalVerdict));
      } catch (error) {
        console.error('Error sanitizing finalVerdict:', error);
        sanitizedFinalVerdict = null;
      }
    }

    // Create the fact-check session
    const factCheckSession = await prisma.factCheckSession.create({
      data: {
        statement: processedStatement,
        keywords: sanitizedKeywords,
        finalVerdict: sanitizedFinalVerdict,
        papers: {
          create: sanitizedPapers.map((paper: any) => ({
            ...paper,
            analysis: analysisResults?.[paper.externalId] ? {
              create: {
                pdfUrl: analysisResults[paper.externalId].pdfUrl || null,
                analysisMethod: analysisResults[paper.externalId].analysisMethod || null,
                supportLevel: analysisResults[paper.externalId].analysis?.support_level || null,
                confidence: analysisResults[paper.externalId].analysis?.confidence || null,
                summary: analysisResults[paper.externalId].analysis?.summary || null,
                relevantSections: analysisResults[paper.externalId].analysis?.relevant_sections || null,
                keyFindings: Array.isArray(analysisResults[paper.externalId].analysis?.key_findings) 
                  ? analysisResults[paper.externalId].analysis.key_findings 
                  : [],
                limitations: Array.isArray(analysisResults[paper.externalId].analysis?.limitations) 
                  ? analysisResults[paper.externalId].analysis.limitations 
                  : [],
                error: analysisResults[paper.externalId].error || null,
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

    console.log('Successfully created fact-check session:', {
      id: factCheckSession.id,
      shareableId: factCheckSession.shareableId,
      papersCount: factCheckSession.papers.length
    });

    return NextResponse.json({
      success: true,
      sessionId: factCheckSession.id,
      shareableId: factCheckSession.shareableId,
      message: 'Fact-check session saved successfully',
    });

  } catch (error) {
    console.error('Error saving fact-check session:', error);
    
    // Provide more specific error information
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n') // First 5 lines of stack
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to save fact-check session',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      },
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
