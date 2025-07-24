import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/SingletonPrismaClient';

export async function POST(req: NextRequest) {
  try {
    // Debug: Check if feedback model exists
    console.log('Prisma client feedback model:', typeof prisma.feedback);
    console.log('Available models:', Object.keys(prisma).filter(key => !key.startsWith('$')));

    const body = await req.json();
    const { type, text, suggestions, sessionId } = body;

    // Validate input
    if (!type && !text && !suggestions) {
      return NextResponse.json(
        { error: 'At least one feedback field is required' },
        { status: 400 }
      );
    }

    // Get additional context from the request
    const userAgent = req.headers.get('user-agent') || undefined;
    const referer = req.headers.get('referer') || undefined;

    // Save feedback to database
    const feedbackModel = (prisma as any).feedback;
    
    if (!feedbackModel) {
      console.error('Feedback model not found in Prisma client');
      return NextResponse.json(
        { error: 'Database model not available' },
        { status: 500 }
      );
    }

    const feedback = await feedbackModel.create({
      data: {
        type: type || null,
        text: text || null,
        suggestions: suggestions || null,
        sessionId: sessionId || null,
        userAgent,
        url: referer,
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Feedback saved successfully',
        id: feedback.id 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
