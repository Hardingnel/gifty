'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Download,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Link as LinkIcon,
  Quote,
  Layers,
  ChevronRight,
  Heart,
  Compass,
  Users,
  Briefcase,
  Award,
  Sparkles,
  BarChart3,
  PieChart as PieIcon,
  Upload,
  Trash2,
  Database,
  ShieldCheck,
  Copy,
  Check
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  SurveyRecord,
  ResearchKPIs,
  DistributionItem,
  parseSurveyCSV,
  computeKPIs
} from '../lib/survey-parser';
import { exportCleanExcel } from '../lib/excel-export';
import SurveyForm from '../components/SurveyForm';

const PALETTE = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
const PIE_COLORS = ['#10B981', '#2563EB', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B'];

const GOOGLE_APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp", "Response ID", "Name", "Gender", "Level of Study", "Institution Type",
        "Programme", "Age Group", "Q1. Areas Managed", "Q2. Preparedness", "Q3. Skills Source",
        "Q4. Time System", "Q5. Difficult Balance", "Q6. Time Guidance", "Q7. Important Skills",
        "Q8. Guidance Received", "Q9. Desired Guidance", "Q10. Stress Coping", "Q11. Wellbeing Guidance",
        "Q12. Finance Challenges", "Q13. Finance Source", "Q14. Finance Utility", "Q15. Social Life",
        "Q16. Social Guidance", "Q17. Social Desired", "Q18. Postgrad Preparedness", "Q19. Career Desired",
        "Q20. Career Guidance", "Q21. Career Source", "Q22. Overall Adequacy", "Q23. Priority Areas",
        "Q24. Foundation Course Utility", "Q25. Preferred Format", "Q26. Wish Taught", "Q27. Recommendations"
      ]);
      var headerRange = sheet.getRange(1, 1, 1, 35);
      headerRange.setFontWeight("bold").setBackground("#1E293B").setFontColor("#FFFFFF");
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([
      data.Timestamp || new Date().toISOString(), data.Response_ID || "", data.Name || "Anonymous",
      data.Gender || "", data.Level_of_Study || "", data.Institution_Type || "", data.Programme || "",
      data.Age_Group || "", data.q1_areas_managed || "", data.q2_preparedness || "", data.q3_skills_source || "",
      data.q4_time_system || "", data.q5_difficult_balance || "", data.q6_time_guidance || "",
      data.q7_personal_dev_important || "", data.q8_personal_dev_received || "", data.q9_personal_dev_desired || "",
      data.q10_stress_coping || "", data.q11_wellbeing_received || "", data.q12_finance_challenges || "",
      data.q13_finance_source || "", data.q14_finance_utility || "", data.q15_social_involvement || "",
      data.q16_social_guidance_received || "", data.q17_social_guidance_desired || "", data.q18_postgrad_preparedness || "",
      data.q19_career_guidance_desired || "", data.q20_career_guidance_received || "", data.q21_career_source || "",
      data.q22_overall_adequacy || "", data.q23_areas_needing_guidance || "", data.q24_course_utility || "",
      data.q25_preferred_format || "", data.q26_wish_taught || "", data.q27_general_recommendations || ""
    ]);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
}`;

interface QuestionCardProps {
  qNumber: string;
  title: string;
  subtitle: string;
  data: DistributionItem[];
  chartType?: 'bar' | 'donut';
  barColor?: string;
}

function QuestionCard({ qNumber, title, subtitle, data, chartType = 'bar', barColor = '#2563EB' }: QuestionCardProps) {
  const chartData = data && data.length > 0 ? data : [{ name: 'No data', count: 0, pct: 0 }];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
            {qNumber}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">{subtitle}</span>
        </div>
        <h4 className="text-sm font-bold text-slate-900 leading-snug">{title}</h4>
      </div>

      {/* Chart Container */}
      <div className="h-60 w-full mb-4">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'donut' ? (
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="count"
                nameKey="name"
                label={({ name, percent }) => `${name.length > 18 ? name.slice(0, 16) + '...' : name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val: any, name: any, item: any) => [`${val} (${(item.payload.pct * 100).toFixed(1)}%)`, 'Responses']} />
            </PieChart>
          ) : (
            <BarChart
              layout="vertical"
              data={chartData.slice(0, 8)}
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis
                type="number"
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                domain={[0, 1]}
                tick={{ fontSize: 10, fill: '#64748B' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fontSize: 10, fill: '#334155' }}
                tickFormatter={(v: string) => (v.length > 22 ? v.slice(0, 20) + '...' : v)}
              />
              <Tooltip formatter={(v: number, _: any, item: any) => [`${(v * 100).toFixed(1)}% (${item.payload.count} students)`, 'Share']} />
              <Bar dataKey="pct" fill={barColor} radius={[0, 4, 4, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Detailed Frequency & Distribution Table */}
      <div className="border-t border-slate-100 pt-3">
        <div className="max-h-40 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                <th className="pb-1">Response Option</th>
                <th className="pb-1 text-right">Count</th>
                <th className="pb-1 text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {chartData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-1.5 pr-2 font-medium truncate max-w-[200px]" title={item.name}>
                    {item.name}
                  </td>
                  <td className="py-1.5 text-right font-mono text-[11px] text-slate-500">{item.count}</td>
                  <td className="py-1.5 text-right font-bold text-slate-900">
                    {(item.pct * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [csvData, setCsvData] = useState<string>('');
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showUrlModal, setShowUrlModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'survey' | 'qualitative' | 'dataset'>('dashboard');
  const [dashboardSection, setDashboardSection] = useState<
    'overview' | 'sec1' | 'sec2' | 'sec3' | 'sec4' | 'sec5' | 'sec6' | 'sec7' | 'sec8' | 'sec9'
  >('overview');
  const [submittedRecords, setSubmittedRecords] = useState<SurveyRecord[]>([]);

  // Demographic Filters
  const [filterLevel, setFilterLevel] = useState<string>('All');
  const [filterInst, setFilterInst] = useState<string>('All');
  const [filterGender, setFilterGender] = useState<string>('All');
  const [searchQuote, setSearchQuote] = useState<string>('');

  // Google Sheet Webhook Sync State
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [sheetModalTab, setSheetModalTab] = useState<'autosave' | 'read'>('autosave');
  const [isTestingWebhook, setIsTestingWebhook] = useState<boolean>(false);
  const [testWebhookResult, setTestWebhookResult] = useState<{
    success?: boolean;
    isAuthBlocked?: boolean;
    message?: string;
    error?: string;
  } | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // Persistence: Load from localStorage and server API
  useEffect(() => {
    // 0. Load saved Google Sheet webhook URL
    const savedWebhook = localStorage.getItem('google_sheet_webhook_url');
    if (savedWebhook) {
      setWebhookUrl(savedWebhook);
    }

    // 1. Immediately hydrate from localStorage for zero delay on refresh
    try {
      const localSaved = localStorage.getItem('survey_submitted_records');
      if (localSaved) {
        const parsed = JSON.parse(localSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSubmittedRecords(parsed);
        }
      }
    } catch (e) {
      console.warn('Error reading local survey records:', e);
    }

    // 2. Fetch server-persisted submissions
    fetchServerResponses();

    // 3. Sync from Google Sheet if connected, otherwise load baseline CSV
    const savedUrl = localStorage.getItem('survey_sheet_url');
    if (savedUrl) {
      setSheetUrl(savedUrl);
      setInputUrl(savedUrl);
      fetchFromUrl(savedUrl);
    } else {
      fetchSampleData();
    }
  }, []);

  const fetchServerResponses = async () => {
    try {
      const res = await fetch('/api/responses');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setSubmittedRecords(prev => {
            const map = new Map<string, SurveyRecord>();
            prev.forEach(r => map.set(r.Response_ID, r));
            json.data.forEach((r: SurveyRecord) => map.set(r.Response_ID, r));
            const merged = Array.from(map.values());
            try {
              localStorage.setItem('survey_submitted_records', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      }
    } catch (err) {
      console.warn('Could not fetch server responses:', err);
    }
  };

  const handleSurveySubmitted = (newRec: SurveyRecord) => {
    setSubmittedRecords(prev => {
      const updated = [newRec, ...prev.filter(r => r.Response_ID !== newRec.Response_ID)];
      try {
        localStorage.setItem('survey_submitted_records', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save to localStorage:', e);
      }
      return updated;
    });
    setActiveTab('dashboard');
  };

  const handleExportJSON = () => {
    if (allClean.length === 0) {
      alert('No survey responses available to export.');
      return;
    }
    const blob = new Blob([JSON.stringify(allClean, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `survey_responses_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        let records: SurveyRecord[] = [];
        if (file.name.endsWith('.json')) {
          records = JSON.parse(text);
        } else if (file.name.endsWith('.csv')) {
          const parsed = parseSurveyCSV(text);
          records = parsed.clean;
        }
        if (Array.isArray(records) && records.length > 0) {
          await fetch('/api/responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(records)
          });
          setSubmittedRecords(prev => {
            const map = new Map<string, SurveyRecord>();
            prev.forEach(r => map.set(r.Response_ID, r));
            records.forEach(r => map.set(r.Response_ID, r));
            const merged = Array.from(map.values());
            try {
              localStorage.setItem('survey_submitted_records', JSON.stringify(merged));
            } catch {}
            return merged;
          });
          alert(`Successfully imported and restored ${records.length} responses!`);
        } else {
          alert('No valid survey records found in selected file.');
        }
      } catch (err: any) {
        alert('Failed to import file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAllData = async () => {
    if (!confirm('Are you sure you want to clear all stored survey responses? This action cannot be undone unless you have downloaded a backup.')) {
      return;
    }
    try {
      await fetch('/api/responses', { method: 'DELETE' });
    } catch {}
    localStorage.removeItem('survey_submitted_records');
    setSubmittedRecords([]);
    alert('All survey responses have been reset.');
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      setTestWebhookResult({ success: false, error: 'Please enter a Google Apps Script Web App URL first.' });
      return;
    }
    setIsTestingWebhook(true);
    setTestWebhookResult(null);
    try {
      const res = await fetch('/api/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl.trim() })
      });
      const data = await res.json();
      setTestWebhookResult(data);
      if (data.success) {
        localStorage.setItem('google_sheet_webhook_url', webhookUrl.trim());
      }
    } catch (err: any) {
      setTestWebhookResult({ success: false, error: err.message || 'Failed to reach webhook endpoint.' });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleSaveWebhook = () => {
    if (!webhookUrl.trim()) {
      alert('Please enter a Google Apps Script Web App URL.');
      return;
    }
    localStorage.setItem('google_sheet_webhook_url', webhookUrl.trim());
    setShowUrlModal(false);
    alert('Google Sheet Webhook saved! All survey responses will now automatically save into your Google Sheet.');
  };

  const fetchSampleData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/sample_raw_responses.csv');
      if (!res.ok) throw new Error('Failed to load initial dataset.');
      const text = await res.text();
      setCsvData(text);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading sample survey data.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFromUrl = async (url: string) => {
    if (!url.trim()) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/fetch-sheet?url=${encodeURIComponent(url.trim())}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        if (errJson && errJson.isAuthError) {
          throw new Error(`${errJson.error} ${errJson.details}`);
        }
        throw new Error(errJson?.error || `Failed to fetch responses (HTTP ${res.status}).`);
      }
      const text = await res.text();
      if (!text || text.trim().length === 0) {
        throw new Error('Received an empty response from the provided Google Sheet link.');
      }
      setCsvData(text);
      localStorage.setItem('survey_sheet_url', url.trim());
      setSheetUrl(url.trim());
      setShowUrlModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching data from Google Sheets.');
    } finally {
      setIsLoading(false);
    }
  };

  // Parsing & Merging Records
  const { raw, clean } = useMemo(() => {
    if (!csvData) return { raw: [], clean: [] };
    return parseSurveyCSV(csvData);
  }, [csvData]);

  const allClean = useMemo(() => {
    return [...submittedRecords, ...clean];
  }, [submittedRecords, clean]);

  const studyLevels = useMemo(() => {
    const set = new Set(allClean.map(r => r.Level_of_Study).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [allClean]);

  const instTypes = useMemo(() => {
    const set = new Set(allClean.map(r => r.Institution_Type).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [allClean]);

  const genders = useMemo(() => {
    const set = new Set(allClean.map(r => r.Gender).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [allClean]);

  const filteredRecords = useMemo(() => {
    return allClean.filter(r => {
      const matchLevel = filterLevel === 'All' || r.Level_of_Study === filterLevel;
      const matchInst = filterInst === 'All' || r.Institution_Type === filterInst;
      const matchGender = filterGender === 'All' || r.Gender === filterGender;
      return matchLevel && matchInst && matchGender;
    });
  }, [allClean, filterLevel, filterInst, filterGender]);

  const kpis: ResearchKPIs | null = useMemo(() => {
    if (filteredRecords.length === 0) return null;
    return computeKPIs(filteredRecords);
  }, [filteredRecords]);

  const qualRecords = useMemo(() => {
    return filteredRecords
      .filter(r => (r.q26_wish_taught && r.q26_wish_taught.length > 0) || (r.q27_general_recommendations && r.q27_general_recommendations.length > 0))
      .filter(r => {
        if (!searchQuote) return true;
        const q = searchQuote.toLowerCase();
        return (
          r.q26_wish_taught.toLowerCase().includes(q) ||
          r.q27_general_recommendations.toLowerCase().includes(q) ||
          r.Programme.toLowerCase().includes(q) ||
          r.Level_of_Study.toLowerCase().includes(q)
        );
      });
  }, [filteredRecords, searchQuote]);

  const handleExportExcel = () => {
    if (!kpis) return;
    exportCleanExcel(raw, filteredRecords, kpis, 'university_life_survey_kpi_dashboard.xlsx');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-inner font-bold">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  University Life Management Survey
                  <span className="text-xs bg-blue-900/80 text-blue-300 px-2 py-0.5 rounded-full border border-blue-700/50">
                    Research Dashboard
                  </span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-700/60">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  Auto-Save Active • Zero Data Loss
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Assessing the Need for a University Life Management Foundation Course
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Hidden Input for Backup Restore */}
            <input
              type="file"
              id="import-backup-input"
              accept=".json,.csv"
              onChange={handleImportJSON}
              className="hidden"
            />

            <button
              onClick={() => document.getElementById('import-backup-input')?.click()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
              title="Import or restore survey responses from JSON or CSV"
            >
              <Upload className="h-3.5 w-3.5 text-blue-400" />
              Import
            </button>

            <button
              onClick={handleExportJSON}
              disabled={allClean.length === 0}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition disabled:opacity-50"
              title="Download raw JSON backup"
            >
              <Database className="h-3.5 w-3.5 text-emerald-400" />
              Backup
            </button>

            {submittedRecords.length > 0 && (
              <button
                onClick={handleClearAllData}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/80 hover:bg-rose-900/90 border border-rose-800 text-rose-300 transition"
                title="Reset or clear saved survey records"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Reset
              </button>
            )}

            <button
              onClick={() => setShowUrlModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
              title="Connect to live Google Sheet (Optional)"
            >
              <LinkIcon className="h-3.5 w-3.5 text-blue-400" />
              {sheetUrl ? 'Sheet Connected' : 'Google Sheet (Opt)'}
            </button>

            <button
              onClick={() => {
                fetchServerResponses();
                if (sheetUrl) fetchFromUrl(sheetUrl);
              }}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
              title="Refresh and sync data"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
              Sync
            </button>

            <button
              onClick={handleExportExcel}
              disabled={!kpis}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
            >
              <Download className="h-3.5 w-3.5" />
              Export Clean Excel
            </button>
          </div>
        </div>
      </header>

      {/* CONNECT GOOGLE SHEET MODAL */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-blue-600" />
                Google Sheet Integration
              </h3>
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setSheetModalTab('autosave')}
                  className={`px-3 py-1 rounded-md transition ${sheetModalTab === 'autosave' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Auto-Save to Sheet
                </button>
                <button
                  type="button"
                  onClick={() => setSheetModalTab('read')}
                  className={`px-3 py-1 rounded-md transition ${sheetModalTab === 'read' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Read Public Sheet
                </button>
              </div>
            </div>

            {sheetModalTab === 'autosave' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
                  <strong className="block font-bold mb-1">Direct Google Sheet Auto-Save (Zero Data Loss)</strong>
                  Whenever respondents submit the survey on this web app, each response is automatically appended as a new row in your Google Sheet.
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-[11px] text-slate-700">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Quick 3-Step Setup in Google Sheets:</span>
                    <button
                      type="button"
                      onClick={handleCopyScript}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[10px] font-bold shadow-sm transition"
                    >
                      {copiedScript ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedScript ? 'Copied to Clipboard!' : 'Copy Apps Script Code'}
                    </button>
                  </div>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                    <li>Open your Google Sheet &gt; Click <strong>Extensions &gt; Apps Script</strong>.</li>
                    <li>Paste the copied script and click <strong>Save</strong>.</li>
                    <li>
                      Click <strong>Deploy &gt; New deployment</strong> &gt; Type: <strong>Web app</strong>.<br />
                      Set <strong>Execute as:</strong> <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">Me</code> and <strong>Who has access:</strong> <code className="bg-amber-100 text-amber-900 font-bold px-1 py-0.5 rounded text-[10px]">Anyone</code>.
                    </li>
                    <li>Copy the resulting Web App URL (<code className="bg-slate-200 px-1 rounded text-[10px]">.../exec</code>) and paste it below.</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Google Apps Script Web App URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={webhookUrl}
                      onChange={e => setWebhookUrl(e.target.value)}
                      className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      disabled={isTestingWebhook || !webhookUrl.trim()}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                    >
                      {isTestingWebhook ? 'Testing...' : 'Test Connection'}
                    </button>
                  </div>
                </div>

                {/* Test Feedback Banner */}
                {testWebhookResult && (
                  <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${testWebhookResult.success ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'}`}>
                    {testWebhookResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="text-[11px] leading-relaxed">
                      {testWebhookResult.message || testWebhookResult.error}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowUrlModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveWebhook}
                    className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition"
                  >
                    Save & Enable Google Sheet Auto-Save
                  </button>
                </div>
              </div>
            )}

            {sheetModalTab === 'read' && (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700">
                  <strong className="block font-bold mb-1 text-slate-900">Read & Visualize Existing Google Sheet Responses</strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                    If you have a Google Form linked to a Google Sheet and want to load past responses into this dashboard:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600">
                    <li>In your Google Sheet, click <strong>Share</strong> (top right).</li>
                    <li>Set General access to <strong>"Anyone with the link can view"</strong>.</li>
                    <li>Click <strong>Copy link</strong> and paste it below.</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Public Google Sheet Link
                  </label>
                  <input
                    type="text"
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                    value={inputUrl}
                    onChange={e => setInputUrl(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowUrlModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => fetchFromUrl(inputUrl)}
                    className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition"
                  >
                    Load Sheet into Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PRIMARY APP NAVIGATION TABS */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-md transition ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              📊 Research KPIs & Visualizations
            </button>
            <button
              onClick={() => setActiveTab('survey')}
              className={`px-3.5 py-1.5 rounded-md transition ${activeTab === 'survey' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              📝 Take Survey
            </button>
            <button
              onClick={() => setActiveTab('qualitative')}
              className={`px-3.5 py-1.5 rounded-md transition ${activeTab === 'qualitative' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              💬 Qualitative Voice (Q26 & Q27)
            </button>
            <button
              onClick={() => setActiveTab('dataset')}
              className={`px-3.5 py-1.5 rounded-md transition ${activeTab === 'dataset' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              📋 Cleaned Dataset ({filteredRecords.length})
            </button>
          </div>

          {/* DEMOGRAPHIC FILTERS */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              Filters:
            </div>

            <select
              value={filterLevel}
              onChange={e => setFilterLevel(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {studyLevels.map(lvl => (
                <option key={lvl} value={lvl}>
                  {lvl === 'All' ? 'Level: All Levels' : lvl}
                </option>
              ))}
            </select>

            <select
              value={filterInst}
              onChange={e => setFilterInst(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {instTypes.map(inst => (
                <option key={inst} value={inst}>
                  {inst === 'All' ? 'Institution: All' : inst}
                </option>
              ))}
            </select>

            <select
              value={filterGender}
              onChange={e => setFilterGender(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {genders.map(g => (
                <option key={g} value={g}>
                  {g === 'All' ? 'Gender: All' : g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* LOADING INDICATOR */}
        {isLoading && (
          <div className="py-20 text-center">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Processing survey responses and generating analytics...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && allClean.length === 0 && activeTab !== 'survey' && (
          <div className="py-16 px-6 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto my-8">
            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Ready to Collect Survey Responses</h3>
            <p className="text-xs text-slate-600 mb-6 max-w-md mx-auto leading-relaxed">
              All mock data has been cleared. The system is clean and ready for real student responses. Connect your live Google Sheet or take the survey directly on the web to populate the dashboard.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setActiveTab('survey')}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                📝 Take Survey (Submit First Response)
              </button>
              <button
                onClick={() => setShowUrlModal(true)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <LinkIcon className="h-3.5 w-3.5 text-blue-600" /> Connect Live Google Sheet
              </button>
            </div>
          </div>
        )}

        {/* NO FILTER MATCH */}
        {!isLoading && allClean.length > 0 && filteredRecords.length === 0 && activeTab !== 'survey' && (
          <div className="py-12 text-center bg-white rounded-xl border border-slate-200 my-6">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No Responses Match Filters</h3>
            <p className="text-xs text-slate-500 mt-1">Try setting Level of Study, Institution Type, or Gender back to "All".</p>
          </div>
        )}

        {/* TAB 1: RESEARCH KPIS & VISUALIZATIONS */}
        {!isLoading && activeTab === 'dashboard' && kpis && (
          <div className="space-y-6">
            {/* 6 RESEARCH SCORECARDS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sample Size (N)</span>
                <div className="my-2 text-2xl font-black text-slate-900">{kpis.n}</div>
                <span className="text-[10px] text-slate-500 font-medium">Verified Participants</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Course Endorsement</span>
                <div className="my-2 text-2xl font-black text-emerald-600">{(kpis.course_endorsement_pct * 100).toFixed(1)}%</div>
                <span className="text-[10px] text-emerald-700 font-medium">{(kpis.course_very_useful_pct * 100).toFixed(1)}% Very Useful</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Prep Deficit Rate</span>
                <div className="my-2 text-2xl font-black text-rose-600">{(kpis.inadequate_pct * 100).toFixed(1)}%</div>
                <span className="text-[10px] text-rose-700 font-medium">Inadequately Prepared</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Post-Grad Unprepared</span>
                <div className="my-2 text-2xl font-black text-rose-600">{(kpis.unprepared_postgrad_pct * 100).toFixed(1)}%</div>
                <span className="text-[10px] text-rose-700 font-medium">Feel Not Prepared At All</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Zero Time Training</span>
                <div className="my-2 text-2xl font-black text-amber-600">{(kpis.no_time_guidance_pct * 100).toFixed(1)}%</div>
                <span className="text-[10px] text-amber-700 font-medium">No Univ Time Guidance</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-sm flex flex-col justify-between">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Financial Need</span>
                <div className="my-2 text-2xl font-black text-blue-600">{(kpis.fin_very_useful_pct * 100).toFixed(1)}%</div>
                <span className="text-[10px] text-blue-700 font-medium">Rate Very Useful</span>
              </div>
            </div>

            {/* SECTION SELECTOR SUB-NAVIGATION */}
            <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1 pb-2">
                Analyze by Survey Section (All 27 Questions):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'overview', label: '📊 Executive Overview' },
                  { id: 'sec1', label: '👤 Sec 1: Profile' },
                  { id: 'sec2', label: '🧭 Sec 2: Experience (Q1-3)' },
                  { id: 'sec3', label: '⏰ Sec 3: Time (Q4-6)' },
                  { id: 'sec4', label: '🌱 Sec 4: Personal Dev (Q7-9)' },
                  { id: 'sec5', label: '❤️ Sec 5: Wellbeing (Q10-11)' },
                  { id: 'sec6', label: '💰 Sec 6: Finance (Q12-14)' },
                  { id: 'sec7', label: '👥 Sec 7: Social Life (Q15-17)' },
                  { id: 'sec8', label: '🎯 Sec 8: Career Prep (Q18-21)' },
                  { id: 'sec9', label: '🎓 Sec 9: Foundation Course (Q22-25)' }
                ].map(sec => (
                  <button
                    key={sec.id}
                    onClick={() => setDashboardSection(sec.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      dashboardSection === sec.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {sec.label}
                  </button>
                ))}
              </div>
            </div>

            {/* VIEW 0: EXECUTIVE OVERVIEW */}
            {dashboardSection === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart 1: Course Utility Donut */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Foundation Course Utility Endorsement (Q24)</h3>
                        <p className="text-xs text-slate-500">Central Research Question - Student demand evaluation</p>
                      </div>
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                        {(kpis.course_endorsement_pct * 100).toFixed(1)}% Endorse
                      </span>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={kpis.course_utility_breakdown}
                            innerRadius={60}
                            outerRadius={95}
                            paddingAngle={4}
                            dataKey="count"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {kpis.course_utility_breakdown.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any, _: any, item: any) => [`${value} (${(item.payload.pct * 100).toFixed(1)}%)`, 'Responses']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Priority Needs Horizontal Bar */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Top Priority Areas Demanded for Structured Guidance (Q23)</h3>
                        <p className="text-xs text-slate-500">% of students voting for each domain (up to 5 choices)</p>
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={kpis.priority_areas}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                          <XAxis type="number" tickFormatter={(val: number) => `${(val * 100).toFixed(0)}%`} domain={[0, 1]} tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10, fill: '#475569' }} />
                          <Tooltip formatter={(val: number) => [`${(val * 100).toFixed(1)}%`, 'Students']} />
                          <Bar dataKey="pct" fill="#6366F1" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart 3: Institutional Support Deficit Matrix */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-slate-900">Institutional Support Deficit Across 5 Pillars</h3>
                      <p className="text-xs text-slate-500">% reporting receiving None or Very Little guidance from university</p>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={kpis.support_deficit} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                          <XAxis dataKey="domain" tick={{ fontSize: 10, fill: '#475569' }} interval={0} angle={-15} textAnchor="end" />
                          <YAxis tickFormatter={(val: number) => `${(val * 100).toFixed(0)}%`} domain={[0, 1]} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(val: number) => [`${(val * 100).toFixed(1)}%`, 'Deficit Rate']} />
                          <Bar dataKey="pct" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 4: Preferred Course Format */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-slate-900">Preferred Learning Format for Foundation Course (Q25)</h3>
                      <p className="text-xs text-slate-500">Student pedagogical preference ranking</p>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={kpis.preferred_formats}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                          <XAxis type="number" tickFormatter={(val: number) => `${(val * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10, fill: '#475569' }} />
                          <Tooltip formatter={(val: number) => [`${(val * 100).toFixed(1)}%`, 'Preference']} />
                          <Bar dataKey="pct" fill="#0EA5E9" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart 5: Cross-Tab by Level of Study */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-slate-900">Preparation Deficit by Level of Study (Cross-Tab)</h3>
                      <p className="text-xs text-slate-500">Comparing post-graduation anxiety vs university inadequacy across academic years</p>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={kpis.study_level_crosstab} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                          <XAxis dataKey="level" tick={{ fontSize: 11 }} />
                          <YAxis tickFormatter={(val: number) => `${(val * 100).toFixed(0)}%`} domain={[0, 1]} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(val: number) => [`${(val * 100).toFixed(1)}%`]} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="postgrad_unprepared_pct" name="Unprepared for Post-Grad" fill="#F97316" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="inadequate_pct" name="Univ Inadequately Prepares" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 6: Areas Managed Beyond Classes */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-slate-900">Non-Academic Areas Managed by Students (Q1)</h3>
                      <p className="text-xs text-slate-500">Domains students must balance alongside coursework</p>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={kpis.areas_managed}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                          <XAxis type="number" tickFormatter={(val: number) => `${(val * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10, fill: '#475569' }} />
                          <Tooltip formatter={(val: number) => [`${(val * 100).toFixed(1)}%`, 'Students']} />
                          <Bar dataKey="pct" fill="#14B8A6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* EXECUTIVE FINDINGS CALLOUT */}
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
                  <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    Executive Research Findings & Policy Recommendations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
                    <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                      <strong className="text-white block mb-1">1. Overwhelming Foundation Course Mandate</strong>
                      {(kpis.course_endorsement_pct * 100).toFixed(1)}% of surveyed students advocate for the introduction of a structured University Life Management Course, with {(kpis.course_very_useful_pct * 100).toFixed(1)}% emphasizing it is "Very Useful".
                    </div>
                    <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                      <strong className="text-white block mb-1">2. Critical Institutional Support Void</strong>
                      {(kpis.inadequate_pct * 100).toFixed(1)}% report that universities prepare them inadequately for life beyond textbooks, while {(kpis.no_time_guidance_pct * 100).toFixed(1)}% received zero guidance on time management.
                    </div>
                    <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                      <strong className="text-white block mb-1">3. Acute Post-Graduation Uncertainty</strong>
                      {(kpis.unprepared_postgrad_pct * 100).toFixed(1)}% of students express high anxiety and lack of preparedness for life after graduation, particularly peaking in senior study cohorts.
                    </div>
                    <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                      <strong className="text-white block mb-1">4. Student-Preferred Course Delivery</strong>
                      The top student-endorsed format is an integrated credit-bearing curriculum course followed by intensive practical workshops and mentorship.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 1: SECTION 1 PARTICIPANT PROFILE */}
            {dashboardSection === 'sec1' && (
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">Section 1: Participant Demographic Profile</h3>
                  <p className="text-xs text-slate-500">Sample distribution by study level, gender, institution type, and age group</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <QuestionCard
                    qNumber="Demographic 1"
                    title="Gender Distribution"
                    subtitle="Single Choice"
                    data={kpis.demographics.gender}
                    chartType="donut"
                  />
                  <QuestionCard
                    qNumber="Demographic 2"
                    title="Current Level of Study"
                    subtitle="Academic Cohort"
                    data={kpis.demographics.level}
                    chartType="donut"
                  />
                  <QuestionCard
                    qNumber="Demographic 3"
                    title="Type of Institution"
                    subtitle="Public vs Private"
                    data={kpis.demographics.institution}
                    chartType="donut"
                  />
                  <QuestionCard
                    qNumber="Demographic 4"
                    title="Age Group"
                    subtitle="Respondent Demographics"
                    data={kpis.demographics.age}
                    chartType="donut"
                  />
                </div>
              </div>
            )}

            {/* VIEW 2: SECTION 2 UNIVERSITY LIFE EXPERIENCE */}
            {dashboardSection === 'sec2' && (
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">Section 2: University Life Experience</h3>
                  <p className="text-xs text-slate-500">Examining non-academic life responsibilities, feelings of preparedness, and skill learning origins</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <QuestionCard
                    qNumber="Question 1"
                    title="Areas Managed Beyond Coursework"
                    subtitle="Select all that apply"
                    data={kpis.section2_experience.q1_areas_managed}
                    chartType="bar"
                    barColor="#2563EB"
                  />
                  <QuestionCard
                    qNumber="Question 2"
                    title="Preparedness to Manage University Life Demands"
                    subtitle="Single Choice"
                    data={kpis.section2_experience.q2_preparedness}
                    chartType="donut"
                  />
                  <QuestionCard
                    qNumber="Question 3"
                    title="How Skills Were Learned"
                    subtitle="Select up to 3"
                    data={kpis.section2_experience.q3_skills_source}
                    chartType="bar"
                    barColor="#10B981"
                  />
                </div>
              </div>
            )}

            {/* VIEW 3: SECTION 3 TIME MANAGEMENT & ORGANIZATION */}
            {dashboardSection === 'sec3' && (
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">Section 3: Time Management & Organization</h3>
                  <p className="text-xs text-slate-500">Assessing students' self-management systems, difficult balancing areas, and institutional training receipt</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <QuestionCard
                    qNumber="Question 4"
                    title="Current Time Management Approach"
                    subtitle="Single Choice"
                    data={kpis.section3_time.q4_time_system}
                    chartType="bar"
                    barColor="#8B5CF6"
                  />
                  <QuestionCard
                    qNumber="Question 5"
                    title="Most Difficult Areas to Balance"
                    subtitle="Select up to 3"
                    data={kpis.section3_time.q5_difficult_balance}
                    chartType="bar"
                    barColor="#EF4444"
                  />
                  <QuestionCard
                    qNumber="Question 6"
                    title="Received Structured Guidance on Time Management"
                    subtitle="Yes / No"
                    data={kpis.section3_time.q6_time_guidance}
                    chartType="donut"
                  />
                </div>
              </div>
            )}

            {/* VIEW 4: SECTION 4 PERSONAL DEVELOPMENT */}
            {dashboardSection === 'sec4' && (
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">Section 4: Personal Development & Self-Management</h3>
                  <p className="text-xs text-slate-500">Valued skills, institutional development opportunities, and areas where students seek structured guidance</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <QuestionCard
                    qNumber="Question 7"
                    title="Personal Development Areas Considered Important"
                    subtitle="Select up to 4"
                    data={kpis.section4_personal_dev.q7_personal_dev_important}
                    chartType="bar"
                    barColor="#3B82F6"
                  />
                  <QuestionCard
                    qNumber="Question 8"
                    title="Guidance Received Through University"
                    subtitle="Single Choice"
                    data={kpis.section4_personal_dev.q8_personal_dev_received}
                    chartType="donut"
                  />
                  <QuestionCard
                    qNumber="Question 9"
                    title="Personal Development Areas Most Desired"
                    subtitle="Select up to 3"
                    data={kpis.section4_personal_dev.q9_personal_dev_desired}
                    chartType="bar"
                    barColor="#10B981"
                  />
                </div>
              </div>
            )}

            {/* VIEW 5: SECTION 5 WELLBEING & STRESS */}
            {dashboardSection === 'sec5' && (
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">Section 5: Wellbeing & Managing University Pressure</h3>
                  <p className="text-xs text-slate-500">Student coping strategies when stressed and perceived institutional wellbeing support</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <QuestionCard
                    qNumber="Question 10"
                    title="Coping Strategies When Stressed or Overwhelmed"
                    subtitle="Select up to 3"
                    data={kpis.section5_wellbeing.q10_stress_coping}
                    chartType="bar"
                    barColor="#EC4899"
                  />
                  <QuestionCard
                    qNumber="Question 11"
                    title="University Guidance/Support on Stress & Wellbeing"
                    subtitle="Single Choice"
                    data={kpis.section5_wellbeing.q11_wellbeing_received}
                    chartType="donut"
                  />
                </div>
              </div>
            )}

            {/* VIEW 6: SECTION 6 FINANCIAL MANAGEMENT */}
            {dashboardSection === 'sec6' && (
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">Section 6: Financial Management</h3>
                  <p className="text-xs text-slate-500">Evaluating money challenges, learning channels, and demand for structured personal finance training</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <QuestionCard
                    qNumber="Question 12"
                    title="Most Challenging Aspects of Managing Money"
                    subtitle="Select up to 3"
                    data={kpis.section6_finance.q12_finance_challenges}
                    chartType="bar"
                    barColor="#F59E0B"
                  />
                  <QuestionCard
                    qNumber="Question 13"
                    title="Where Students Learned Money Management"
                    subtitle="Select up to 2"
                    data={kpis.section6_finance.q13_finance_source}
                    chartType="bar"
                    barColor="#6366F1"
                  />
                  <QuestionCard
                    qNumber="Question 14"
                    title="Perceived Utility of Structured Financial Guidance"
                    subtitle="Single Choice"
                    data={kpis.section6_finance.q14_finance_utility}
                    chartType="donut"
                  />
                </div>
              </div>
            )}

            {/* VIEW 7: SECTION 7 SOCIAL RELATIONSHIPS & STUDENT LIFE */}
            {dashboardSection === 'sec7' && (
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">Section 7: Relationships, Social Life & Student Engagement</h3>
                  <p className="text-xs text-slate-500">Extracurricular involvement, institutional guidance on leadership/balance, and relationship guidance needs</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <QuestionCard
                    qNumber="Question 15"
                    title="Social & Student Life Areas Currently Managed"
                    subtitle="Select all that apply"
                    data={kpis.section7_social.q15_social_involvement}
                    chartType="bar"
                    barColor="#06B6D4"
                  />
                  <QuestionCard
                    qNumber="Question 16"
                    title="University Guidance on Student Activities & Balance"
                    subtitle="Single Choice"
                    data={kpis.section7_social.q16_social_guidance_received}
                    chartType="donut"
                  />
                  <QuestionCard
                    qNumber="Question 17"
                    title="Social & Relationship Areas Needing Guidance"
                    subtitle="Select up to 3"
                    data={kpis.section7_social.q17_social_guidance_desired}
                    chartType="bar"
                    barColor="#10B981"
                  />
                </div>
              </div>
            )}

            {/* VIEW 8: SECTION 8 CAREER & FUTURE PREPARATION */}
            {dashboardSection === 'sec8' && (
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">Section 8: Preparation for the Future & Life After University</h3>
                  <p className="text-xs text-slate-500">Post-graduation preparedness feelings, guidance desires, institutional career support, and career guidance sources</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <QuestionCard
                    qNumber="Question 18"
                    title="Preparedness for Life After University"
                    subtitle="Single Choice"
                    data={kpis.section8_career.q18_postgrad_preparedness}
                    chartType="donut"
                  />
                  <QuestionCard
                    qNumber="Question 19"
                    title="Most Useful Career & Future Guidance Areas"
                    subtitle="Select up to 4"
                    data={kpis.section8_career.q19_career_guidance_desired}
                    chartType="bar"
                    barColor="#6366F1"
                  />
                  <QuestionCard
                    qNumber="Question 20"
                    title="University Support for Career Preparation"
                    subtitle="Single Choice"
                    data={kpis.section8_career.q20_career_guidance_received}
                    chartType="donut"
                  />
                  <QuestionCard
                    qNumber="Question 21"
                    title="Where Students Get Career Guidance"
                    subtitle="Select up to 3"
                    data={kpis.section8_career.q21_career_source}
                    chartType="bar"
                    barColor="#F59E0B"
                  />
                </div>
              </div>
            )}

            {/* VIEW 9: SECTION 9 FOUNDATION COURSE DEMAND (CENTRAL THESIS) */}
            {dashboardSection === 'sec9' && (
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">Section 9: Perceived Gaps & Foundation Course Need (Central Thesis)</h3>
                  <p className="text-xs text-slate-500">Institutional adequacy evaluation, priority guidance areas, course utility endorsement, and preferred delivery format</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <QuestionCard
                    qNumber="Question 22"
                    title="Overall Adequacy of University Life Preparation"
                    subtitle="Single Choice"
                    data={kpis.section9_gaps_course.q22_overall_adequacy}
                    chartType="donut"
                  />
                  <QuestionCard
                    qNumber="Question 23"
                    title="Priority Areas Needing Structured Guidance"
                    subtitle="Select up to 5"
                    data={kpis.section9_gaps_course.q23_areas_needing_guidance}
                    chartType="bar"
                    barColor="#EF4444"
                  />
                  <QuestionCard
                    qNumber="Question 24"
                    title="Foundation Course Utility (The Central Question)"
                    subtitle="Central Research Hypothesis"
                    data={kpis.section9_gaps_course.q24_course_utility}
                    chartType="donut"
                  />
                  <QuestionCard
                    qNumber="Question 25"
                    title="Preferred Learning Format for Course"
                    subtitle="Select up to 2"
                    data={kpis.section9_gaps_course.q25_preferred_format}
                    chartType="bar"
                    barColor="#10B981"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: IN-APP SURVEY FORM */}
        {!isLoading && activeTab === 'survey' && (
          <div className="py-2">
            <SurveyForm
              onSurveySubmitted={handleSurveySubmitted}
            />
          </div>
        )}

        {/* TAB 3: QUALITATIVE VOICE */}
        {!isLoading && activeTab === 'qualitative' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Verbatim Student Quotes & Recommendations (Q26 & Q27)</h3>
                <p className="text-xs text-slate-500">Unfiltered qualitative student experiences and policy advice</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search quotes by keyword..."
                  value={searchQuote}
                  onChange={e => setSearchQuote(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {qualRecords.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                No qualitative responses match your search. Submit a survey or connect your Google Sheet to view verbatim responses.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {qualRecords.map((r, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
                          {r.Level_of_Study} • {r.Programme}
                        </span>
                        <span className="text-[10px] text-slate-400">{r.Institution_Type}</span>
                      </div>

                      {r.q26_wish_taught && (
                        <div className="mb-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Wish Someone Had Taught Me (Q26):
                          </span>
                          <blockquote className="text-xs text-slate-800 italic bg-slate-50 p-2.5 rounded-lg border-l-2 border-blue-500">
                            "{r.q26_wish_taught}"
                          </blockquote>
                        </div>
                      )}

                      {r.q27_general_recommendations && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Recommendation for Universities (Q27):
                          </span>
                          <blockquote className="text-xs text-slate-800 italic bg-slate-50 p-2.5 rounded-lg border-l-2 border-emerald-500">
                            "{r.q27_general_recommendations}"
                          </blockquote>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CLEANED DATASET */}
        {!isLoading && activeTab === 'dataset' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Standardized Survey Dataset</h3>
                <p className="text-xs text-slate-500">Showing {filteredRecords.length} records formatted for academic analysis</p>
              </div>

              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
              >
                <Download className="h-3.5 w-3.5" />
                Export Clean Excel
              </button>
            </div>

            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-900 text-white sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5 border-b border-slate-800">ID</th>
                    <th className="p-2.5 border-b border-slate-800">Level</th>
                    <th className="p-2.5 border-b border-slate-800">Gender</th>
                    <th className="p-2.5 border-b border-slate-800">Institution</th>
                    <th className="p-2.5 border-b border-slate-800">Programme</th>
                    <th className="p-2.5 border-b border-slate-800">Course Utility (Q24)</th>
                    <th className="p-2.5 border-b border-slate-800">Time Guidance (Q6)</th>
                    <th className="p-2.5 border-b border-slate-800">Overall Adequacy (Q22)</th>
                    <th className="p-2.5 border-b border-slate-800">Post-Grad Prep (Q18)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {filteredRecords.slice(0, 100).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-mono text-[11px] font-bold text-slate-500">{r.Response_ID}</td>
                      <td className="p-2.5 font-medium text-slate-900">{r.Level_of_Study}</td>
                      <td className="p-2.5">{r.Gender}</td>
                      <td className="p-2.5">{r.Institution_Type}</td>
                      <td className="p-2.5">{r.Programme}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${r.q24_course_utility === 'Very useful' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                          {r.q24_course_utility}
                        </span>
                      </td>
                      <td className="p-2.5">{r.q6_time_guidance}</td>
                      <td className="p-2.5">{r.q22_overall_adequacy}</td>
                      <td className="p-2.5">{r.q18_postgrad_preparedness}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredRecords.length > 100 && (
              <div className="p-3 text-center text-xs text-slate-400 border-t border-slate-100">
                Displaying first 100 records in browser. Click "Export Clean Excel" to view all records in Excel.
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          University Life Management Research Survey Pipeline • Fully Deployable to Vercel
        </div>
      </footer>
    </div>
  );
}
