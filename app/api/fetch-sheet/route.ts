import { NextRequest, NextResponse } from 'next/server';

function convertGoogleSheetsUrl(url: string): string {
  if (!url) return '';
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return url;
  const sheetId = match[1];
  const gidMatch = url.match(/[#&]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  const targetUrl = convertGoogleSheetsUrl(rawUrl.trim());

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      redirect: 'follow',
      cache: 'no-store'
    });

    const finalUrl = response.url || '';
    const text = await response.text();

    // Check if Google redirected to a sign-in wall
    if (finalUrl.includes('accounts.google.com') || text.includes('accounts.google.com/v3/signin') || text.includes('Sign in - Google Accounts')) {
      return NextResponse.json(
        {
          error: 'Access Denied: Google is requiring authentication.',
          isAuthError: true,
          details: rawUrl.includes('script.google.com')
            ? 'For Google Apps Script: Click "Deploy" > "Manage deployments" > Edit (pencil icon) > change "Who has access" from "Only myself" to "Anyone" > click "Deploy".'
            : 'For Google Sheets: Open your sheet > click "Share" (top right) > under General access change to "Anyone with the link can view" > click "Copy link".'
        },
        { status: 403 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Google returned HTTP ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Return the fetched text (CSV or JSON)
    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Network error connecting to Google: ${error.message}` },
      { status: 500 }
    );
  }
}
