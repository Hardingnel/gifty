import * as XLSX from 'xlsx';
import { SurveyRecord, ResearchKPIs, DistributionItem } from './survey-parser';

function formatDistSection(title: string, items: DistributionItem[]): any[][] {
  if (!items || items.length === 0) {
    return [[`[ ${title} ]`], ['Option / Response', 'Count', 'Share (%)'], ['No responses', 0, '0.0%'], []];
  }
  return [
    [`[ ${title} ]`],
    ['Option / Response', 'Frequency (Count)', 'Share (%)'],
    ...items.map(i => [i.name, i.count, `${(i.pct * 100).toFixed(1)}%`]),
    []
  ];
}

export function exportCleanExcel(
  rawRows: any[],
  cleanRecords: SurveyRecord[],
  kpis: ResearchKPIs,
  fileName = 'university_life_survey_kpi_dashboard.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // Tab 1: Executive KPI Summary
  const kpiData = [
    ['UNIVERSITY LIFE MANAGEMENT RESEARCH SURVEY: EXECUTIVE KPI SUMMARY'],
    ['Research Topic: Assessing the Need for a University Life Management Foundation Course'],
    ['Generated via Web Dashboard', new Date().toLocaleString()],
    [],
    ['Core Research Metric', 'Value', 'Benchmark / Interpretation'],
    ['Sample Size (N)', kpis.n, 'Total Verified Student Respondents'],
    ['Foundation Course Endorsement (Q24)', `${(kpis.course_endorsement_pct * 100).toFixed(1)}%`, 'Students Rating Course Very or Somewhat Useful'],
    ['Very Useful Rating Rate (Q24)', `${(kpis.course_very_useful_pct * 100).toFixed(1)}%`, 'Strongest Endorsement Tier'],
    ['Institutional Preparation Deficit (Q22)', `${(kpis.inadequate_pct * 100).toFixed(1)}%`, 'Report University Prepares Inadequately for Life Demands'],
    ['Post-Graduation Unpreparedness (Q18)', `${(kpis.unprepared_postgrad_pct * 100).toFixed(1)}%`, 'Feel Not Prepared at All for Life After Graduation'],
    ['Time Management Training Void (Q6)', `${(kpis.no_time_guidance_pct * 100).toFixed(1)}%`, 'Received Zero Structured Training from University'],
    ['Financial Guidance Demand (Q14)', `${(kpis.fin_very_useful_pct * 100).toFixed(1)}%`, 'Rate Structured Financial Guidance as Very Useful'],
    [],
    ['--- RESEARCH CROSS-TABULATION: PREPARATION BY STUDY LEVEL ---'],
    ['Level of Study', 'Sample Size (N)', 'Post-Grad Unprepared Rate', 'Univ Inadequately Prepares Rate'],
    ...kpis.study_level_crosstab.map(s => [
      s.level,
      s.total,
      `${(s.postgrad_unprepared_pct * 100).toFixed(1)}%`,
      `${(s.inadequate_pct * 100).toFixed(1)}%`
    ]),
    [],
    ['--- INSTITUTIONAL GUIDANCE DEFICIT ACROSS 5 PILLARS ---'],
    ['Pillar / Domain', 'Deficit Count', 'Deficit Share (%)'],
    ...kpis.support_deficit.map(d => [d.domain, d.count, `${(d.pct * 100).toFixed(1)}%`])
  ];
  const wsKpi = XLSX.utils.aoa_to_sheet(kpiData);
  XLSX.utils.book_append_sheet(wb, wsKpi, 'KPI Summary');

  // Tab 2: All 9 Survey Sections Statistical Breakdown
  const allSectionsData: any[][] = [
    ['========================================================================'],
    ['UNIVERSITY LIFE MANAGEMENT SURVEY: COMPLETE 9-SECTION STATISTICAL BREAKDOWN'],
    ['========================================================================'],
    [],
    ['### SECTION 1: PARTICIPANT PROFILE ###'],
    [],
    ...formatDistSection('Gender Distribution', kpis.demographics.gender),
    ...formatDistSection('Current Level of Study', kpis.demographics.level),
    ...formatDistSection('Type of Institution', kpis.demographics.institution),
    ...formatDistSection('Age Group', kpis.demographics.age),
    [],
    ['### SECTION 2: UNIVERSITY LIFE EXPERIENCE ###'],
    [],
    ...formatDistSection('Q1: Areas Managed Beyond Academics (Select all that apply)', kpis.section2_experience.q1_areas_managed),
    ...formatDistSection('Q2: Overall Preparedness for Demands of University Life', kpis.section2_experience.q2_preparedness),
    ...formatDistSection('Q3: Where Skills Were Learned (Select up to 3)', kpis.section2_experience.q3_skills_source),
    [],
    ['### SECTION 3: TIME MANAGEMENT & ORGANIZATION ###'],
    [],
    ...formatDistSection('Q4: Current Time Management Approach', kpis.section3_time.q4_time_system),
    ...formatDistSection('Q5: Most Difficult Areas to Balance (Select up to 3)', kpis.section3_time.q5_difficult_balance),
    ...formatDistSection('Q6: Received Structured Guidance on Time Management', kpis.section3_time.q6_time_guidance),
    [],
    ['### SECTION 4: PERSONAL DEVELOPMENT & SELF-MANAGEMENT ###'],
    [],
    ...formatDistSection('Q7: Important Personal Development Areas (Select up to 4)', kpis.section4_personal_dev.q7_personal_dev_important),
    ...formatDistSection('Q8: Guidance Received Through University to Develop Skills', kpis.section4_personal_dev.q8_personal_dev_received),
    ...formatDistSection('Q9: Personal Development Areas Most Desired (Select up to 3)', kpis.section4_personal_dev.q9_personal_dev_desired),
    [],
    ['### SECTION 5: WELLBEING & MANAGING UNIVERSITY PRESSURE ###'],
    [],
    ...formatDistSection('Q10: Stress Coping Strategies (Select up to 3)', kpis.section5_wellbeing.q10_stress_coping),
    ...formatDistSection('Q11: University Guidance / Support on Stress & Wellbeing', kpis.section5_wellbeing.q11_wellbeing_received),
    [],
    ['### SECTION 6: FINANCIAL MANAGEMENT ###'],
    [],
    ...formatDistSection('Q12: Most Challenging Aspects of Managing Money (Select up to 3)', kpis.section6_finance.q12_finance_challenges),
    ...formatDistSection('Q13: Sources of Financial Knowledge (Select up to 3)', kpis.section6_finance.q13_finance_source),
    ...formatDistSection('Q14: Perceived Utility of Structured Financial Guidance', kpis.section6_finance.q14_finance_utility),
    [],
    ['### SECTION 7: SOCIAL RELATIONSHIPS & STUDENT ENGAGEMENT ###'],
    [],
    ...formatDistSection('Q15: Current Social & Student Life Involvement (Select all that apply)', kpis.section7_social.q15_social_involvement),
    ...formatDistSection('Q16: University Guidance on Balancing Social & Student Life', kpis.section7_social.q16_social_guidance_received),
    ...formatDistSection('Q17: Social & Relationship Areas Desiring Guidance (Select up to 3)', kpis.section7_social.q17_social_guidance_desired),
    [],
    ['### SECTION 8: PREPARATION FOR THE FUTURE & LIFE AFTER UNIVERSITY ###'],
    [],
    ...formatDistSection('Q18: Preparedness for Life After University', kpis.section8_career.q18_postgrad_preparedness),
    ...formatDistSection('Q19: Most Useful Career & Future Guidance Areas (Select up to 3)', kpis.section8_career.q19_career_guidance_desired),
    ...formatDistSection('Q20: University Guidance Received on Career Preparation', kpis.section8_career.q20_career_guidance_received),
    ...formatDistSection('Q21: Primary Current Source of Career Guidance (Select up to 2)', kpis.section8_career.q21_career_source),
    [],
    ['### SECTION 9: PERCEIVED GAPS & NEED FOR A FOUNDATION COURSE ###'],
    [],
    ...formatDistSection('Q22: Overall Adequacy of University Life Preparation', kpis.section9_gaps_course.q22_overall_adequacy),
    ...formatDistSection('Q23: Priority Areas Needing Structured Guidance (Select up to 5)', kpis.section9_gaps_course.q23_areas_needing_guidance),
    ...formatDistSection('Q24: Foundation Course Utility Endorsement (Central Thesis)', kpis.section9_gaps_course.q24_course_utility),
    ...formatDistSection('Q25: Preferred Learning Format for Foundation Course (Select up to 2)', kpis.section9_gaps_course.q25_preferred_format)
  ];
  const wsAllSections = XLSX.utils.aoa_to_sheet(allSectionsData);
  XLSX.utils.book_append_sheet(wb, wsAllSections, '9 Sections Statistical Tables');

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
      Institution: r.Institution_Type,
      Programme: r.Programme,
      'One Thing You Wish Someone Had Taught You (Q26)': r.q26_wish_taught || '(None provided)',
      'Recommendations for Universities (Q27)': r.q27_general_recommendations || '(None provided)'
    }));
  const wsQual = XLSX.utils.json_to_sheet(qualRows.length > 0 ? qualRows : [{ 'Notice': 'No qualitative comments submitted yet.' }]);
  XLSX.utils.book_append_sheet(wb, wsQual, 'Qualitative Voice');

  // Tab 5: Raw Ingestion Archive
  if (rawRows && rawRows.length > 0) {
    const wsRaw = XLSX.utils.json_to_sheet(rawRows);
    XLSX.utils.book_append_sheet(wb, wsRaw, 'Raw Ingestion Archive');
  }

  // Trigger download
  XLSX.writeFile(wb, fileName);
}
