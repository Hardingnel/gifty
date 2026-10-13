import { NextRequest, NextResponse } from 'next/server';
import { saveSurveySubmission } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.Response_ID) {
      return NextResponse.json(
        { error: 'Invalid survey payload: missing Response_ID' },
        { status: 400 }
      );
    }

    // Persist to local JSON storage and optional cloud DB
    await saveSurveySubmission(body);

    return NextResponse.json({
      success: true,
      message: 'Survey submission safely stored without data loss!',
      record: body,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in submit-survey route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit survey' },
      { status: 500 }
    );
  }
}
