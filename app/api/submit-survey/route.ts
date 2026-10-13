import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if a Google Sheets webhook URL or Google Form Action URL is configured
    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      } catch (err) {
        console.warn('Could not forward to Google Sheets webhook:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Survey submission recorded successfully!',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit survey' },
      { status: 500 }
    );
  }
}
