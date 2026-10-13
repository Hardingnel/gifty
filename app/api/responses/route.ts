import { NextRequest, NextResponse } from 'next/server';
import { getSurveySubmissions, clearSurveySubmissions, saveSurveySubmission } from '@/lib/storage';
import { SurveyRecord } from '@/lib/survey-parser';

export async function GET() {
  try {
    const submissions = await getSurveySubmissions();
    return NextResponse.json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearSurveySubmissions();
    return NextResponse.json({
      success: true,
      message: 'All survey responses cleared successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to clear submissions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (Array.isArray(body)) {
      for (const record of body) {
        if (record && record.Response_ID) {
          await saveSurveySubmission(record);
        }
      }
      return NextResponse.json({
        success: true,
        message: `Successfully restored ${body.length} survey responses`
      });
    } else if (body && body.Response_ID) {
      await saveSurveySubmission(body);
      return NextResponse.json({
        success: true,
        message: 'Successfully imported response'
      });
    }

    return NextResponse.json(
      { error: 'Invalid payload: expected SurveyRecord or array of SurveyRecords' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to import responses' },
      { status: 500 }
    );
  }
}
