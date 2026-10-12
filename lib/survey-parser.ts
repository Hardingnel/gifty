import Papa from 'papaparse';

export interface SurveyRecord {
  Response_ID: string;
  Timestamp: string;
  Name: string;
  Gender: string;
  Level_of_Study: string;
  Institution_Type: string;
  Programme: string;
  Age_Group: string;
  q1_areas_managed: string;
  q2_preparedness: string;
  q3_skills_source: string;
  q4_time_system: string;
  q5_difficult_balance: string;
  q6_time_guidance: string;
  q7_personal_dev_important: string;
  q8_personal_dev_received: string;
  q9_personal_dev_desired: string;
  q10_stress_coping: string;
  q11_wellbeing_received: string;
  q12_finance_challenges: string;
  q13_finance_source: string;
  q14_finance_utility: string;
  q15_social_involvement: string;
  q16_social_guidance_received: string;
  q17_social_guidance_desired: string;
  q18_postgrad_preparedness: string;
  q19_career_guidance_desired: string;
  q20_career_guidance_received: string;
  q21_career_source: string;
  q22_overall_adequacy: string;
  q23_areas_needing_guidance: string;
  q24_course_utility: string;
  q25_preferred_format: string;
  q26_wish_taught: string;
  q27_general_recommendations: string;
  [key: string]: any;
}

export interface ResearchKPIs {
  n: number;
  course_endorsement_pct: number;
  course_very_useful_pct: number;
  inadequate_pct: number;
  unprepared_postgrad_pct: number;
  no_time_guidance_pct: number;
  fin_very_useful_pct: number;
  course_utility_breakdown: { name: string; value: number; pct: number }[];
  priority_areas: { choice: string; count: number; pct: number }[];
  support_deficit: { domain: string; count: number; pct: number }[];
  preferred_formats: { choice: string; count: number; pct: number }[];
  study_level_crosstab: { level: string; total: number; postgrad_unprepared_pct: number; inadequate_pct: number }[];
  areas_managed: { choice: string; count: number; pct: number }[];
}

export function convertGoogleSheetsUrl(url: string): string {
  if (!url) return '';
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return url;
  const sheetId = match[1];
  const gidMatch = url.match(/[#&]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

const PATTERNS: Record<string, RegExp[]> = {
  timestamp: [/timestamp/i, /^date/i, /submission/i],
  name: [/1\.\s*name/i, /name\s*\(optional\)/i],
  gender: [/2\.\s*gender/i, /gender/i],
  study_level: [/3\.\s*current level/i, /level of study/i],
  institution_type: [/4\.\s*type of institution/i, /institution/i],
  programme: [/5\.\s*programme/i, /field of study/i],
  age_group: [/6\.\s*age group/i, /age group/i],
  q1_areas_managed: [/q1\./i, /beyond attending classes.*which areas/i, /areas.*manage/i],
  q2_preparedness: [/q2\./i, /how prepared do you feel/i],
  q3_skills_source: [/q3\./i, /how did you learn most/i],
  q4_time_system: [/q4\./i, /describe the way you currently manage/i],
  q5_difficult_balance: [/q5\./i, /difficult to balance/i],
  q6_time_guidance: [/q6\./i, /structured guidance.*time/i],
  q7_personal_dev_important: [/q7\./i, /personal development.*important/i],
  q8_personal_dev_received: [/q8\./i, /how much guidance.*develop these skills/i],
  q9_personal_dev_desired: [/q9\./i, /personal development.*like more/i],
  q10_stress_coping: [/q10\./i, /stress or feel overwhelmed/i],
  q11_wellbeing_received: [/q11\./i, /guidance or support.*stress/i],
  q12_finance_challenges: [/q12\./i, /managing money are most challenging/i],
  q13_finance_source: [/q13\./i, /where have you learned.*managing money/i],
  q14_finance_utility: [/q14\./i, /useful would structured guidance on financial/i],
  q15_social_involvement: [/q15\./i, /social and student life/i],
  q16_social_guidance_received: [/q16\./i, /guidance or support.*student activities/i],
  q17_social_guidance_desired: [/q17\./i, /useful to receive more structured guidance on/i],
  q18_postgrad_preparedness: [/q18\./i, /prepared.*life after university/i],
  q19_career_guidance_desired: [/q19\./i, /career and future preparation.*useful/i],
  q20_career_guidance_received: [/q20\./i, /guidance or support.*careers/i],
  q21_career_source: [/q21\./i, /where do you currently get most of your career/i],
  q22_overall_adequacy: [/q22\./i, /how adequately.*prepares you/i],
  q23_areas_needing_guidance: [/q23\./i, /students need more structured/i],
  q24_course_utility: [/q24\./i, /foundation course/i, /central question/i],
  q25_preferred_format: [/q25\./i, /format would you prefer/i],
  q26_wish_taught: [/q26\./i, /wish someone had taught/i],
  q27_general_recommendations: [/q27\./i, /universities could do to better prepare/i]
};

export function parseSurveyCSV(csvText: string): { raw: any[]; clean: SurveyRecord[] } {
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const rawRows: any[] = result.data as any[];
  if (!rawRows || rawRows.length === 0) {
    return { raw: [], clean: [] };
  }

  const headers = Object.keys(rawRows[0]);
  const colMap: Record<string, string> = {};

  for (const h of headers) {
    for (const [key, patterns] of Object.entries(PATTERNS)) {
      if (patterns.some(p => p.test(h))) {
        colMap[key] = h;
        break;
      }
    }
  }

  const cleanRecords: SurveyRecord[] = rawRows.map((row, idx) => {
    const getValue = (key: string, defaultVal = '') => {
      const headerName = colMap[key];
      return headerName && row[headerName] ? String(row[headerName]).trim() : defaultVal;
    };

    return {
      Response_ID: `RESP-${1001 + idx}`,
      Timestamp: getValue('timestamp', new Date().toISOString()),
      Name: getValue('name', 'Anonymous') || 'Anonymous',
      Gender: getValue('gender', 'Prefer not to say'),
      Level_of_Study: getValue('study_level', 'First Year'),
      Institution_Type: getValue('institution_type', 'Public university'),
      Programme: getValue('programme', 'General Studies') || 'General Studies',
      Age_Group: getValue('age_group', '20-22'),
      q1_areas_managed: getValue('q1_areas_managed'),
      q2_preparedness: getValue('q2_preparedness'),
      q3_skills_source: getValue('q3_skills_source'),
      q4_time_system: getValue('q4_time_system'),
      q5_difficult_balance: getValue('q5_difficult_balance'),
      q6_time_guidance: getValue('q6_time_guidance'),
      q7_personal_dev_important: getValue('q7_personal_dev_important'),
      q8_personal_dev_received: getValue('q8_personal_dev_received'),
      q9_personal_dev_desired: getValue('q9_personal_dev_desired'),
      q10_stress_coping: getValue('q10_stress_coping'),
      q11_wellbeing_received: getValue('q11_wellbeing_received'),
      q12_finance_challenges: getValue('q12_finance_challenges'),
      q13_finance_source: getValue('q13_finance_source'),
      q14_finance_utility: getValue('q14_finance_utility'),
      q15_social_involvement: getValue('q15_social_involvement'),
      q16_social_guidance_received: getValue('q16_social_guidance_received'),
      q17_social_guidance_desired: getValue('q17_social_guidance_desired'),
      q18_postgrad_preparedness: getValue('q18_postgrad_preparedness'),
      q19_career_guidance_desired: getValue('q19_career_guidance_desired'),
      q20_career_guidance_received: getValue('q20_career_guidance_received'),
      q21_career_source: getValue('q21_career_source'),
      q22_overall_adequacy: getValue('q22_overall_adequacy'),
      q23_areas_needing_guidance: getValue('q23_areas_needing_guidance'),
      q24_course_utility: getValue('q24_course_utility'),
      q25_preferred_format: getValue('q25_preferred_format'),
      q26_wish_taught: getValue('q26_wish_taught'),
      q27_general_recommendations: getValue('q27_general_recommendations')
    };
  });

  return { raw: rawRows, clean: cleanRecords };
}

function countMultiSelect(records: SurveyRecord[], field: keyof SurveyRecord): { choice: string; count: number; pct: number }[] {
  const counts: Record<string, number> = {};
  const n = records.length;

  for (const r of records) {
    const val = r[field];
    if (typeof val === 'string' && val.trim()) {
      const items = val.split(',').map(s => s.trim()).filter(Boolean);
      for (const item of items) {
        counts[item] = (counts[item] || 0) + 1;
      }
    }
  }

  return Object.entries(counts)
    .map(([choice, count]) => ({
      choice,
      count,
      pct: n > 0 ? count / n : 0
    }))
    .sort((a, b) => b.count - a.count);
}

export function computeKPIs(records: SurveyRecord[]): ResearchKPIs {
  const n = records.length;

  // Q24 Course Utility
  const q24Counts: Record<string, number> = {
    'Very useful': 0,
    'Somewhat useful': 0,
    'Not useful at all': 0,
    "I'm not sure": 0
  };
  for (const r of records) {
    if (q24Counts[r.q24_course_utility] !== undefined) {
      q24Counts[r.q24_course_utility]++;
    }
  }
  const endorsementCount = (q24Counts['Very useful'] || 0) + (q24Counts['Somewhat useful'] || 0);

  // Q22 Overall Inadequacy
  const inadequateCount = records.filter(r => r.q22_overall_adequacy === 'Inadequately').length;

  // Q18 Post-Grad Unprepared
  const unpreparedPostgradCount = records.filter(r => r.q18_postgrad_preparedness === 'Not prepared at all').length;

  // Q6 Time Management Void
  const noTimeGuidanceCount = records.filter(r => r.q6_time_guidance === 'No').length;

  // Q14 Financial Need
  const finVeryUsefulCount = records.filter(r => r.q14_finance_utility === 'Very useful').length;

  // Support Deficit across 5 Pillars
  const defTime = records.filter(r => r.q6_time_guidance === 'No').length;
  const defPersonal = records.filter(r => ['Very little', 'None'].includes(r.q8_personal_dev_received)).length;
  const defWellbeing = records.filter(r => ['Very little', 'None'].includes(r.q11_wellbeing_received)).length;
  const defSocial = records.filter(r => ['Very little', 'None'].includes(r.q16_social_guidance_received)).length;
  const defCareer = records.filter(r => ['Very little', 'None'].includes(r.q20_career_guidance_received)).length;

  const supportDeficit = [
    { domain: 'Time Management', count: defTime, pct: n > 0 ? defTime / n : 0 },
    { domain: 'Personal Dev', count: defPersonal, pct: n > 0 ? defPersonal / n : 0 },
    { domain: 'Wellbeing & Stress', count: defWellbeing, pct: n > 0 ? defWellbeing / n : 0 },
    { domain: 'Student Life', count: defSocial, pct: n > 0 ? defSocial / n : 0 },
    { domain: 'Career & Future', count: defCareer, pct: n > 0 ? defCareer / n : 0 }
  ].sort((a, b) => b.pct - a.pct);

  // Cross-tab by Level of Study
  const levels = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];
  const studyCrosstab = levels.map(lvl => {
    const sub = records.filter(r => r.Level_of_Study === lvl);
    const subN = sub.length;
    const postgradUnprepared = sub.filter(r => r.q18_postgrad_preparedness === 'Not prepared at all').length;
    const inadequate = sub.filter(r => r.q22_overall_adequacy === 'Inadequately').length;
    return {
      level: lvl,
      total: subN,
      postgrad_unprepared_pct: subN > 0 ? postgradUnprepared / subN : 0,
      inadequate_pct: subN > 0 ? inadequate / subN : 0
    };
  });

  return {
    n,
    course_endorsement_pct: n > 0 ? endorsementCount / n : 0,
    course_very_useful_pct: n > 0 ? (q24Counts['Very useful'] || 0) / n : 0,
    inadequate_pct: n > 0 ? inadequateCount / n : 0,
    unprepared_postgrad_pct: n > 0 ? unpreparedPostgradCount / n : 0,
    no_time_guidance_pct: n > 0 ? noTimeGuidanceCount / n : 0,
    fin_very_useful_pct: n > 0 ? finVeryUsefulCount / n : 0,
    course_utility_breakdown: [
      { name: 'Very useful', value: q24Counts['Very useful'] || 0, pct: n > 0 ? (q24Counts['Very useful'] || 0) / n : 0 },
      { name: 'Somewhat useful', value: q24Counts['Somewhat useful'] || 0, pct: n > 0 ? (q24Counts['Somewhat useful'] || 0) / n : 0 },
      { name: 'Not useful at all', value: q24Counts['Not useful at all'] || 0, pct: n > 0 ? (q24Counts['Not useful at all'] || 0) / n : 0 },
      { name: "I'm not sure", value: q24Counts["I'm not sure"] || 0, pct: n > 0 ? (q24Counts["I'm not sure"] || 0) / n : 0 }
    ],
    priority_areas: countMultiSelect(records, 'q23_areas_needing_guidance').slice(0, 8),
    support_deficit: supportDeficit,
    preferred_formats: countMultiSelect(records, 'q25_preferred_format').slice(0, 6),
    study_level_crosstab: studyCrosstab,
    areas_managed: countMultiSelect(records, 'q1_areas_managed').slice(0, 8)
  };
}
