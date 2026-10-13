import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid URL starting with https://' },
        { status: 400 }
      );
    }

    // Ping the URL via GET
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    const text = await res.text();

    if (text.includes('accounts.google.com') || text.includes('ServiceLogin')) {
      return NextResponse.json({
        success: false,
        isAuthBlocked: true,
        error: "Google Permission Blocked: The script is currently restricted to 'Only myself'. In Google Apps Script, click Deploy > Manage deployments > Edit > set 'Who has access' to 'Anyone', then re-deploy and test again."
      });
    }

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        error: `The endpoint returned HTTP ${res.status}. Please check your Web App URL.`
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Connection successful! Google Sheet Webhook is active and reachable without authorization barriers.'
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Connection failed: ${err.message || 'Unknown network error'}` },
      { status: 500 }
    );
  }
}
