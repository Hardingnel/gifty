import fs from 'fs';
import path from 'path';
import { SurveyRecord } from './survey-parser';

const DATA_DIR = path.join(process.cwd(), 'data');
const JSON_FILE_PATH = path.join(DATA_DIR, 'survey_submissions.json');

/**
 * Persists a new survey submission.
 * 1. Syncs to Cloud DB (Supabase / Neon / Vercel KV / Upstash) if configured.
 * 2. Writes to persistent local JSON file (survives app restarts and page refreshes).
 */
export async function saveSurveySubmission(record: SurveyRecord): Promise<void> {
  // Option A: Supabase / PostgreSQL REST API (Zero-dependency cloud database)
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/survey_responses`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(record)
      });
    } catch (err) {
      console.warn('Cloud sync to Supabase failed:', err);
    }
  }

  // Option B: Upstash Redis / Vercel KV REST API
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (kvUrl && kvToken) {
    try {
      await fetch(`${kvUrl}/rpush/survey_records/${encodeURIComponent(JSON.stringify(record))}`, {
        headers: { Authorization: `Bearer ${kvToken}` }
      });
    } catch (err) {
      console.warn('Cloud sync to KV failed:', err);
    }
  }

  // Option C: Local JSON File Storage
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let records: SurveyRecord[] = [];
    if (fs.existsSync(JSON_FILE_PATH)) {
      const fileData = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
      if (fileData.trim()) {
        try {
          records = JSON.parse(fileData);
        } catch {
          records = [];
        }
      }
    }

    // Avoid duplicate Response_ID
    records = [record, ...records.filter(r => r.Response_ID !== record.Response_ID)];
    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Local JSON file write error:', err);
  }
}

/**
 * Retrieves all stored survey submissions.
 */
export async function getSurveySubmissions(): Promise<SurveyRecord[]> {
  // Check Supabase if configured
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/survey_responses?select=*&order=Timestamp.desc`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        cache: 'no-store'
      });
      if (res.ok) {
        const cloudData = await res.json();
        if (Array.isArray(cloudData) && cloudData.length > 0) {
          return cloudData;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch from Supabase:', err);
    }
  }

  // Check KV if configured
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/lrange/survey_records/0/-1`, {
        headers: { Authorization: `Bearer ${kvToken}` },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.result) && data.result.length > 0) {
          return data.result
            .map((s: string) => {
              try {
                return JSON.parse(s);
              } catch {
                return null;
              }
            })
            .filter(Boolean);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch from KV:', err);
    }
  }

  // Fallback to local file storage
  try {
    if (fs.existsSync(JSON_FILE_PATH)) {
      const fileData = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
      if (fileData.trim()) {
        return JSON.parse(fileData);
      }
    }
  } catch (err) {
    console.error('Local JSON file read error:', err);
  }

  return [];
}

/**
 * Clears all stored survey submissions.
 */
export async function clearSurveySubmissions(): Promise<void> {
  try {
    if (fs.existsSync(JSON_FILE_PATH)) {
      fs.writeFileSync(JSON_FILE_PATH, '[]', 'utf-8');
    }
  } catch (err) {
    console.error('Error clearing local storage:', err);
  }
}
