import * as XLSX from 'xlsx';
import { SurveyRecord, ResearchKPIs } from './survey-parser';

export function exportCleanExcel(rawRows: any[], cleanRecords: SurveyRecord[], kpis: ResearchKPIs, fileName = 'survey_kpi_dashboard.xlsx') {
  const wb = XLSX.utils.book_new();

  // Tab 1: KPI Summary
  const kpiData = [
    ['UNIVERSITY LIFE MANAGEMENT SURVEY: EXECUTIVE RESEARCH KPI DASHBOARD'],
    ['Research Topic: Assessing the Need for a University Life Management Foundation Course'],
    ['Generated via Web Dashboard', new Date().toLocaleString()],
    [],
    ['Core Research Metric', 'Value', 'Status / Benchmark'],
    ['Sample Size (N)', kpis.n, 'Total Verified Student Respondents'],
    ['Foundation Course Endorsement (Q24)', `${(kpis.course_endorsement_pct * 100).toFixed(1)}%`, 'Endorse Proposed Course (Very / Somewhat Useful)'],
    ['Very Useful Rating Rate (Q24)', `${(kpis.course_very_useful_pct * 100).toFixed(1)}%`, 'Consider Course Very Useful'],
    ['Institutional Preparation Deficit (Q22)', `${(kpis.inadequate_pct * 100).toFixed(1)}%`, 'Report University Prepares Inadequately'],
    ['Post-Graduation Unpreparedness (Q18)', `${(kpis.unprepared_postgrad_pct * 100).toFixed(1)}%`, 'Feel Not Prepared at All for Life After Graduation'],
    ['Time Management Training Void (Q6)', `${(kpis.no_time_guidance_pct * 100).toFixed(1)}%`, 'Received Zero Structured Training from University'],
    ['Financial Guidance Demand (Q14)', `${(kpis.fin_very_useful_pct * 100).toFixed(1)}%`, 'Rate Structured Money Guidance as Very Useful']
  ];
  const wsKpi = XLSX.utils.aoa_to_sheet(kpiData);
  XLSX.utils.book_append_sheet(wb, wsKpi, 'KPI Summary');

  // Tab 2: Summary Tables
  const summaryTablesData = [
    ['--- FOUNDATION COURSE UTILITY (Q24) ---'],
    ['Category', 'Count', 'Percentage'],
    ...kpis.course_utility_breakdown.map(c => [c.name, c.value, `${(c.pct * 100).toFixed(1)}%`]),
    [],
    ['--- TOP STUDENT PRIORITIES DEMANDED FOR GUIDANCE (Q23) ---'],
    ['Domain Choice', 'Count', '% of Students'],
    ...kpis.priority_areas.map(p => [p.choice, p.count, `${(p.pct * 100).toFixed(1)}%`]),
    [],
    ['--- INSTITUTIONAL GUIDANCE DEFICIT ACROSS 5 PILLARS ---'],
    ['Domain', 'Deficit Count', 'Deficit Rate'],
    ...kpis.support_deficit.map(d => [d.domain, d.count, `${(d.pct * 100).toFixed(1)}%`]),
    [],
    ['--- PREPARATION DEFICIT BY LEVEL OF STUDY ---'],
    ['Level of Study', 'Sample N', 'Not Prepared for Postgrad %', 'Univ Prepares Inadequately %'],
    ...kpis.study_level_crosstab.map(s => [s.level, s.total, `${(s.postgrad_unprepared_pct * 100).toFixed(1)}%`, `${(s.inadequate_pct * 100).toFixed(1)}%`])
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryTablesData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary Tables');

  // Tab 3: Cleaned Dataset
  const wsClean = XLSX.utils.json_to_sheet(cleanRecords);
  XLSX.utils.book_append_sheet(wb, wsClean, 'Cleaned Dataset');

  // Tab 4: Qualitative Voice (Q26 & Q27)
  const qualRows = cleanRecords
    .filter(r => (r.q26_wish_taught && r.q26_wish_taught.length > 0) || (r.q27_general_recommendations && r.q27_general_recommendations.length > 0))
    .map(r => ({
      Response_ID: r.Response_ID,
      Level_of_Study: r.Level_of_Study,
      Gender: r.Gender,
      Programme: r.Programme,
      'One Thing You Wish Someone Had Taught You (Q26)': r.q26_wish_taught,
      'Recommendations for Universities (Q27)': r.q27_general_recommendations
    }));
  const wsQual = XLSX.utils.json_to_sheet(qualRows);
  XLSX.utils.book_append_sheet(wb, wsQual, 'Qualitative Voice');

  // Tab 5: Raw Ingestion Archive
  if (rawRows && rawRows.length > 0) {
    const wsRaw = XLSX.utils.json_to_sheet(rawRows);
    XLSX.utils.book_append_sheet(wb, wsRaw, 'Raw Ingestion Archive');
  }

  // Trigger browser download
  XLSX.writeFile(wb, fileName);
}
