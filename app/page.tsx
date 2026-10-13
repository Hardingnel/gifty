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
  ExternalLink
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
  parseSurveyCSV,
  computeKPIs,
  convertGoogleSheetsUrl
} from '../lib/survey-parser';
import { exportCleanExcel } from '../lib/excel-export';
import SurveyForm from '../components/SurveyForm';

const COLORS_PIE = ['#10B981', '#2563EB', '#EF4444', '#F59E0B'];

export default function DashboardPage() {
  const [csvData, setCsvData] = useState<string>('');
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showUrlModal, setShowUrlModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'survey' | 'qualitative' | 'dataset'>('dashboard');
  const [submittedRecords, setSubmittedRecords] = useState<SurveyRecord[]>([]);

  // Filters
  const [filterLevel, setFilterLevel] = useState<string>('All');
  const [filterInst, setFilterInst] = useState<string>('All');
  const [filterGender, setFilterGender] = useState<string>('All');
  const [searchQuote, setSearchQuote] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Initial Data Load
  useEffect(() => {
    const savedUrl = localStorage.getItem('survey_sheet_url');
    if (savedUrl) {
      setSheetUrl(savedUrl);
      setInputUrl(savedUrl);
      fetchFromUrl(savedUrl);
    } else {
      fetchSampleData();
    }
  }, []);

  const fetchSampleData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/sample_raw_responses.csv');
      if (!res.ok) throw new Error('Failed to load sample data.');
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
        throw new Error('Received an empty response from the provided Google link.');
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

  // Parse Raw & Clean Records
  const { raw, clean } = useMemo(() => {
    if (!csvData) return { raw: [], clean: [] };
    return parseSurveyCSV(csvData);
  }, [csvData]);

  // Combined Clean Records (Fetched CSV + Live Submitted on Web)
  const allClean = useMemo(() => {
    return [...submittedRecords, ...clean];
  }, [submittedRecords, clean]);

  // Available Filter Options
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

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return allClean.filter(r => {
      const matchLevel = filterLevel === 'All' || r.Level_of_Study === filterLevel;
      const matchInst = filterInst === 'All' || r.Institution_Type === filterInst;
      const matchGender = filterGender === 'All' || r.Gender === filterGender;
      return matchLevel && matchInst && matchGender;
    });
  }, [allClean, filterLevel, filterInst, filterGender]);

  // Recomputed KPIs
  const kpis: ResearchKPIs | null = useMemo(() => {
    if (filteredRecords.length === 0) return null;
    return computeKPIs(filteredRecords);
  }, [filteredRecords]);

  // Qualitative Rows
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
      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-inner font-bold">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                University Life Management Survey
                <span className="text-xs bg-blue-900/80 text-blue-300 px-2 py-0.5 rounded-full border border-blue-700/50">
                  Research Dashboard
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Assessing the Need for a University Life Management Foundation Course
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setShowUrlModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
              title="Connect to live Google Sheet"
            >
              <LinkIcon className="h-3.5 w-3.5 text-blue-400" />
              {sheetUrl ? 'Sheet Connected' : 'Connect Google Sheet'}
            </button>

            <button
              onClick={() => (sheetUrl ? fetchFromUrl(sheetUrl) : fetchSampleData())}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
              title="Refresh Data"
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
              Download Clean Excel (.xlsx)
            </button>
          </div>
        </div>
      </header>

      {/* CONNECT GOOGLE SHEET MODAL */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-blue-600" />
              Connect Live Google Form Responses
            </h3>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Connect your survey responses to update the dashboard in real-time.
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 text-[11px] text-slate-700 space-y-2">
              <div>
                <strong className="text-emerald-700 font-semibold block">Option 1: Google Sheet Link (Recommended)</strong>
                <span>1. In your Google Form, click <strong>Responses</strong> &gt; <strong>Link to Sheets</strong>.<br />
                2. In the Google Sheet, click <strong>Share</strong> (top right) &gt; set to <strong>"Anyone with the link can view"</strong> &gt; <strong>Copy link</strong>.</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <strong className="text-blue-700 font-semibold block">Option 2: Google Apps Script Web App</strong>
                <span>If using an Apps Script Web App URL (<code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">.../exec</code>), make sure in Apps Script Deploy settings that <strong>"Who has access"</strong> is set to <strong>"Anyone"</strong>.</span>
              </div>
            </div>

            <input
              type="text"
              placeholder="Paste Google Sheet URL (https://docs.google.com/spreadsheets/d/...) or Apps Script URL"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setShowUrlModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => fetchFromUrl(inputUrl)}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition"
              >
                Connect & Load Responses
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* ERROR NOTIFICATION */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TOP FILTER & NAVIGATION BAR */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Navigation Tabs */}
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

          {/* Demographic Filters */}
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
        {!isLoading && filteredRecords.length === 0 && (
          <div className="py-16 text-center bg-white rounded-xl border border-slate-200">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Responses Found</h3>
            <p className="text-xs text-slate-500 mt-1">Try resetting your filters or check your Google Sheet link.</p>
          </div>
        )}

        {/* TAB 1: EXECUTIVE RESEARCH DASHBOARD */}
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

            {/* CHARTS ROW 1 */}
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
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {kpis.course_utility_breakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value} students`, 'Responses']} />
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
                      <YAxis type="category" dataKey="choice" width={140} tick={{ fontSize: 10, fill: '#475569' }} />
                      <Tooltip formatter={(val: number) => [`${(val * 100).toFixed(1)}%`, 'Students']} />
                      <Bar dataKey="pct" fill="#6366F1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* CHARTS ROW 2 */}
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
                      <YAxis type="category" dataKey="choice" width={150} tick={{ fontSize: 10, fill: '#475569' }} />
                      <Tooltip formatter={(val: number) => [`${(val * 100).toFixed(1)}%`, 'Preference']} />
                      <Bar dataKey="pct" fill="#0EA5E9" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* CHARTS ROW 3 */}
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
                      <YAxis type="category" dataKey="choice" width={140} tick={{ fontSize: 10, fill: '#475569' }} />
                      <Tooltip formatter={(val: number) => [`${(val * 100).toFixed(1)}%`, 'Students']} />
                      <Bar dataKey="pct" fill="#14B8A6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* EXECUTIVE RESEARCH SUMMARY CALLOUT */}
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

        {/* TAB: IN-APP SURVEY FORM */}
        {!isLoading && activeTab === 'survey' && (
          <div className="py-2">
            <SurveyForm
              onSurveySubmitted={(newRec) => {
                setSubmittedRecords(prev => [newRec, ...prev]);
                setActiveTab('dashboard');
              }}
            />
          </div>
        )}

        {/* TAB 2: QUALITATIVE VOICE */}
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
          </div>
        )}

        {/* TAB 3: CLEANED DATASET */}
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
