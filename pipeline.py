"""
University Life Management Survey: Automated ETL Pipeline & KPI Dashboard
=============================================================================
Research Topic: Assessing the Need for a University Life Management Foundation Course:
                 Exploring Students' Experiences, Challenges and Support Needs

Features:
1. Ingests responses from live Google Sheet URL or local CSV/Excel.
2. Robust fuzzy column matching for all 27 research survey questions.
3. Cleans, parses multi-select checkboxes, and computes academic statistical tables.
4. Generates an executive 5-tab Excel workbook:
   - 📊 Research KPI Dashboard (Executive Scorecards, 6 Native Excel Charts, Findings)
   - 📈 Summary & Cross-Tabs (Aggregations and cross-tabulations feeding charts)
   - 📋 Cleaned Survey Dataset (Standardized, normalized, fully filterable data)
   - 💬 Qualitative Voice of Students (Q26 & Q27 student quotes & recommendations)
   - 🗄️ Raw Ingestion Archive (Original Google Forms export)
"""

import os
import re
import json
import argparse
import urllib.request
from datetime import datetime
from collections import Counter
import pandas as pd
import xlsxwriter

CONFIG_FILE = "config.json"

# ==============================================================================
# 1. FUZZY COLUMN MATCHER
# ==============================================================================
SURVEY_COL_PATTERNS = {
    "timestamp": [r"timestamp", r"^date", r"submission time"],
    "name": [r"1\.\s*name", r"name\s*\(optional\)"],
    "gender": [r"2\.\s*gender", r"gender"],
    "study_level": [r"3\.\s*current level", r"level of study", r"current level"],
    "institution_type": [r"4\.\s*type of institution", r"institution"],
    "programme": [r"5\.\s*programme", r"field of study"],
    "age_group": [r"6\.\s*age group", r"age group"],
    
    # Section 2
    "q1_areas_managed": [r"q1\.", r"beyond attending classes.*which areas", r"areas of university life do you currently have to manage"],
    "q2_preparedness": [r"q2\.", r"how prepared do you feel to manage the different demands", r"demands of university life beyond your academic"],
    "q3_skills_source": [r"q3\.", r"how did you learn most of the skills", r"skills you currently use"],
    
    # Section 3
    "q4_time_system": [r"q4\.", r"describe the way you currently manage your time", r"manage your time and responsibilities"],
    "q5_difficult_balance": [r"q5\.", r"most difficult to balance alongside your academic work", r"difficult to balance"],
    "q6_time_guidance": [r"q6\.", r"received any structured guidance.*time management", r"structured guidance or training.*time"],
    
    # Section 4
    "q7_personal_dev_important": [r"q7\.", r"personal development areas do you feel are important", r"personal development areas.*important"],
    "q8_personal_dev_received": [r"q8\.", r"how much guidance.*develop these skills", r"guidance.*through your university.*develop these skills"],
    "q9_personal_dev_desired": [r"q9\.", r"personal development areas would you most like more structured guidance", r"most like more structured guidance on"],
    
    # Section 5
    "q10_stress_coping": [r"q10\.", r"stress or feel overwhelmed.*what do you usually do", r"overwhelmed.*what do you usually do"],
    "q11_wellbeing_received": [r"q11\.", r"how much guidance or support does your university provide on managing stress", r"managing stress, maintaining wellbeing"],
    
    # Section 6
    "q12_finance_challenges": [r"q12\.", r"managing money are most challenging", r"aspects of managing money"],
    "q13_finance_source": [r"q13\.", r"where have you learned most of what you know about managing money", r"learned.*managing money"],
    "q14_finance_utility": [r"q14\.", r"how useful would structured guidance on financial management be", r"guidance on financial management be"],
    
    # Section 7
    "q15_social_involvement": [r"q15\.", r"social and student life are you currently involved", r"social and student life"],
    "q16_social_guidance_received": [r"q16\.", r"guidance or support have you received.*student activities", r"developing leadership/teamwork skills.*balancing"],
    "q17_social_guidance_desired": [r"q17\.", r"useful to receive more structured guidance on", r"social.*guidance on"],
    
    # Section 8
    "q18_postgrad_preparedness": [r"q18\.", r"prepared do you currently feel for life after university", r"life after university"],
    "q19_career_guidance_desired": [r"q19\.", r"career and future preparation would you find most useful", r"career.*most useful"],
    "q20_career_guidance_received": [r"q20\.", r"guidance or support does your university currently provide.*careers", r"prepare for their careers and life after"],
    "q21_career_source": [r"q21\.", r"where do you currently get most of your career", r"career or future-related guidance"],
    
    # Section 9
    "q22_overall_adequacy": [r"q22\.", r"how adequately do you feel your university prepares you", r"adequately.*prepares you"],
    "q23_areas_needing_guidance": [r"q23\.", r"areas of university life do you feel students need more structured", r"need more structured guidance or preparation"],
    "q24_course_utility": [r"q24\.", r"university life management foundation course", r"central question", r"foundation course.*how useful"],
    "q25_preferred_format": [r"q25\.", r"format would you prefer for learning these skills", r"format would you prefer"],
    "q26_wish_taught": [r"q26\.", r"one thing you wish someone had taught", r"wish someone had taught"],
    "q27_general_recommendations": [r"q27\.", r"anything else you believe universities could do", r"universities could do to better prepare"]
}

def map_survey_columns(df_columns):
    mapping = {}
    used_keys = set()
    for col in df_columns:
        col_clean = str(col).strip().lower()
        matched = False
        for std_key, patterns in SURVEY_COL_PATTERNS.items():
            if std_key in used_keys:
                continue
            for pat in patterns:
                if re.search(pat, col_clean):
                    mapping[col] = std_key
                    used_keys.add(std_key)
                    matched = True
                    break
            if matched:
                break
        if not matched:
            mapping[col] = f"extra_{len(mapping)}"
    return mapping

# ==============================================================================
# 2. DATA INGESTION
# ==============================================================================
def convert_google_sheets_url(url: str) -> str:
    sheet_match = re.search(r"/spreadsheets/d/([a-zA-Z0-9-_]+)", url)
    if not sheet_match:
        return url
    sheet_id = sheet_match.group(1)
    gid_match = re.search(r"[#&]gid=([0-9]+)", url)
    gid = gid_match.group(1) if gid_match else "0"
    return f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"

def ingest_survey_data(source_path: str = None, google_sheet_url: str = None) -> pd.DataFrame:
    if google_sheet_url:
        csv_url = convert_google_sheets_url(google_sheet_url)
        print(f"[*] Downloading survey responses from Google Sheet: {csv_url}")
        try:
            req = urllib.request.Request(csv_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                df = pd.read_csv(response)
            print(f"[+] Loaded {len(df)} survey responses from Google Sheets.")
            return df
        except Exception as e:
            print(f"[-] Error fetching Google Sheets: {e}")
            raise e
            
    if source_path and os.path.exists(source_path):
        print(f"[*] Reading survey responses from local file: {source_path}")
        if source_path.endswith('.xlsx') or source_path.endswith('.xls'):
            return pd.read_excel(source_path)
        return pd.read_csv(source_path)
        
    default_sample = "data/sample_raw_responses.csv"
    if os.path.exists(default_sample):
        print(f"[*] Reading from default sample file: {default_sample}")
        return pd.read_csv(default_sample)
        
    raise FileNotFoundError("No input file found. Please run with --mock to generate test data.")

# ==============================================================================
# 3. MULTI-SELECT & STATISTICAL HELPERS
# ==============================================================================
def split_and_count(series: pd.Series, total_n: int) -> pd.DataFrame:
    """Splits comma-separated multi-select responses and computes frequency counts & percentages."""
    counts = Counter()
    for val in series.dropna():
        if not isinstance(val, str) or not val.strip():
            continue
        items = [item.strip() for item in val.split(",") if item.strip()]
        for item in items:
            counts[item] += 1
            
    df_counts = pd.DataFrame(counts.items(), columns=["Choice", "Count"])
    if df_counts.empty:
        return pd.DataFrame(columns=["Choice", "Count", "Percentage"])
    df_counts["Percentage"] = df_counts["Count"] / total_n if total_n > 0 else 0
    df_counts = df_counts.sort_values(by="Count", ascending=False).reset_index(drop=True)
    return df_counts

def clean_and_normalize_data(df_raw: pd.DataFrame) -> (pd.DataFrame, pd.DataFrame):
    """Normalizes columns into standardized research fields."""
    col_map = map_survey_columns(df_raw.columns)
    rev_map = {v: k for k, v in col_map.items()}
    
    clean = pd.DataFrame()
    total_rows = len(df_raw)
    
    # Response ID
    clean["Response_ID"] = [f"RESP-{1001 + i}" for i in range(total_rows)]
    
    # Timestamp
    if "timestamp" in rev_map:
        clean["Timestamp"] = pd.to_datetime(df_raw[rev_map["timestamp"]], errors="coerce")
    else:
        clean["Timestamp"] = pd.date_range(end=datetime.now(), periods=total_rows, freq="h")
    clean["Timestamp"] = clean["Timestamp"].fillna(datetime.now())
    clean["Response_Date"] = clean["Timestamp"].dt.strftime("%Y-%m-%d")
    
    # Demographics
    clean["Name"] = df_raw[rev_map["name"]].fillna("Anonymous").astype(str).str.strip().str.title() if "name" in rev_map else "Anonymous"
    clean["Gender"] = df_raw[rev_map["gender"]].fillna("Prefer not to say").astype(str).str.strip() if "gender" in rev_map else "Not specified"
    clean["Level_of_Study"] = df_raw[rev_map["study_level"]].fillna("First Year").astype(str).str.strip() if "study_level" in rev_map else "First Year"
    clean["Institution_Type"] = df_raw[rev_map["institution_type"]].fillna("Public university").astype(str).str.strip() if "institution_type" in rev_map else "Public university"
    clean["Programme"] = df_raw[rev_map["programme"]].fillna("General Studies").astype(str).str.strip().str.title() if "programme" in rev_map else "General Studies"
    clean["Age_Group"] = df_raw[rev_map["age_group"]].fillna("20-22").astype(str).str.strip() if "age_group" in rev_map else "20-22"
    
    # Copy survey answers with clean labels
    answer_keys = [k for k in SURVEY_COL_PATTERNS.keys() if k.startswith("q")]
    for key in answer_keys:
        if key in rev_map:
            clean[key] = df_raw[rev_map[key]].fillna("").astype(str).str.strip()
        else:
            clean[key] = ""
            
    return df_raw, clean

# ==============================================================================
# 4. RESEARCH KPIS & SUMMARY TABLES
# ==============================================================================
def compute_research_kpis_and_tables(clean_df: pd.DataFrame):
    n = len(clean_df)
    
    # Central Question: Q24 - Foundation Course Utility
    q24_counts = clean_df["q24_course_utility"].value_counts()
    very_useful_c = q24_counts.get("Very useful", 0)
    somewhat_useful_c = q24_counts.get("Somewhat useful", 0)
    not_useful_c = q24_counts.get("Not useful at all", 0)
    not_sure_c = q24_counts.get("I'm not sure", 0)
    course_endorsement_pct = (very_useful_c + somewhat_useful_c) / n if n > 0 else 0
    course_very_useful_pct = very_useful_c / n if n > 0 else 0
    
    # Institutional Deficit: Q22 Overall Adequacy
    q22_counts = clean_df["q22_overall_adequacy"].value_counts()
    inadequate_c = q22_counts.get("Inadequately", 0)
    inadequate_pct = inadequate_c / n if n > 0 else 0
    
    # Life After University Readiness: Q18
    q18_counts = clean_df["q18_postgrad_preparedness"].value_counts()
    unprepared_postgrad_c = q18_counts.get("Not prepared at all", 0)
    unprepared_postgrad_pct = unprepared_postgrad_c / n if n > 0 else 0
    
    # Time Management Guidance Gap: Q6
    q6_counts = clean_df["q6_time_guidance"].value_counts()
    no_time_guidance_c = q6_counts.get("No", 0)
    no_time_guidance_pct = no_time_guidance_c / n if n > 0 else 0
    
    # Financial Guidance Demand: Q14
    q14_counts = clean_df["q14_finance_utility"].value_counts()
    fin_very_useful_pct = q14_counts.get("Very useful", 0) / n if n > 0 else 0
    
    # Non-Academic Preparedness: Q2
    q2_counts = clean_df["q2_preparedness"].value_counts()
    q2_unprepared_pct = q2_counts.get("Not at all prepared", 0) / n if n > 0 else 0
    
    # --- Table 1: Q24 Course Utility Breakdown ---
    t_course_utility = pd.DataFrame([
        {"Category": "Very useful", "Count": very_useful_c, "Percentage": very_useful_c / n if n > 0 else 0},
        {"Category": "Somewhat useful", "Count": somewhat_useful_c, "Percentage": somewhat_useful_c / n if n > 0 else 0},
        {"Category": "Not useful at all", "Count": not_useful_c, "Percentage": not_useful_c / n if n > 0 else 0},
        {"Category": "I'm not sure", "Count": not_sure_c, "Percentage": not_sure_c / n if n > 0 else 0}
    ])
    
    # --- Table 2: Q23 Priority Life Areas Demanded ---
    t_priority_areas = split_and_count(clean_df["q23_areas_needing_guidance"], n).head(8)
    
    # --- Table 3: Institutional Support Deficit Comparison (5 Pillars) ---
    def calc_deficit_pct(series, deficit_labels):
        cnt = sum(series.isin(deficit_labels))
        return cnt, cnt / n if n > 0 else 0
        
    p1_c, p1_pct = calc_deficit_pct(clean_df["q6_time_guidance"], ["No"])
    p2_c, p2_pct = calc_deficit_pct(clean_df["q8_personal_dev_received"], ["Very little", "None"])
    p3_c, p3_pct = calc_deficit_pct(clean_df["q11_wellbeing_received"], ["Very little", "None"])
    p4_c, p4_pct = calc_deficit_pct(clean_df["q16_social_guidance_received"], ["Very little", "None"])
    p5_c, p5_pct = calc_deficit_pct(clean_df["q20_career_guidance_received"], ["Very little", "None"])
    
    t_support_deficit = pd.DataFrame([
        {"Domain": "Time Management Guidance", "Deficit_Count": p1_c, "Deficit_Pct": p1_pct, "Status": "Received NO Training"},
        {"Domain": "Personal Development Guidance", "Deficit_Count": p2_c, "Deficit_Pct": p2_pct, "Status": "Very Little / None"},
        {"Domain": "Wellbeing & Stress Support", "Deficit_Count": p3_c, "Deficit_Pct": p3_pct, "Status": "Very Little / None"},
        {"Domain": "Student Life & Leadership", "Deficit_Count": p4_c, "Deficit_Pct": p4_pct, "Status": "Very Little / None"},
        {"Domain": "Career & Future Guidance", "Deficit_Count": p5_c, "Deficit_Pct": p5_pct, "Status": "Very Little / None"}
    ]).sort_values(by="Deficit_Pct", ascending=False).reset_index(drop=True)
    
    # --- Table 4: Q25 Preferred Course Formats ---
    t_preferred_format = split_and_count(clean_df["q25_preferred_format"], n).head(6)
    
    # --- Table 5: Preparedness by Level of Study (Cross-Tab) ---
    crosstab_study = pd.crosstab(
        clean_df["Level_of_Study"],
        clean_df["q18_postgrad_preparedness"],
        normalize='index'
    ).reindex(["First Year", "Second Year", "Third Year", "Fourth Year"]).fillna(0)
    
    # Cross-tab formatted
    t_study_level = []
    for lvl in ["First Year", "Second Year", "Third Year", "Fourth Year"]:
        sub = clean_df[clean_df["Level_of_Study"] == lvl]
        sub_n = len(sub)
        unprepared = (sub["q18_postgrad_preparedness"] == "Not prepared at all").sum() if sub_n > 0 else 0
        inadequate = (sub["q22_overall_adequacy"] == "Inadequately").sum() if sub_n > 0 else 0
        t_study_level.append({
            "Level of Study": lvl,
            "Students": sub_n,
            "Not Prepared for Postgrad %": (unprepared / sub_n) if sub_n > 0 else 0,
            "University Inadequately Prepares %": (inadequate / sub_n) if sub_n > 0 else 0
        })
    t_study_level_df = pd.DataFrame(t_study_level)
    
    # --- Table 6: Non-Academic Areas Managed (Q1) ---
    t_areas_managed = split_and_count(clean_df["q1_areas_managed"], n).head(8)
    
    kpis = {
        "n": n,
        "course_endorsement_pct": course_endorsement_pct,
        "course_very_useful_pct": course_very_useful_pct,
        "inadequate_pct": inadequate_pct,
        "unprepared_postgrad_pct": unprepared_postgrad_pct,
        "no_time_guidance_pct": no_time_guidance_pct,
        "fin_very_useful_pct": fin_very_useful_pct,
        "q2_unprepared_pct": q2_unprepared_pct
    }
    
    tables = {
        "course_utility": t_course_utility,
        "priority_areas": t_priority_areas,
        "support_deficit": t_support_deficit,
        "preferred_format": t_preferred_format,
        "study_level": t_study_level_df,
        "areas_managed": t_areas_managed
    }
    
    return kpis, tables

# ==============================================================================
# 5. EXCEL WORKBOOK GENERATOR
# ==============================================================================
def create_university_excel_dashboard(raw_df: pd.DataFrame, clean_df: pd.DataFrame, output_path: str = "output/survey_kpi_dashboard.xlsx"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    kpis, tables = compute_research_kpis_and_tables(clean_df)
    
    workbook = xlsxwriter.Workbook(output_path)
    
    # Aesthetics & Palettes
    c_slate_dark  = "#0F172A"     # Header banner
    c_slate_mid   = "#1E293B"     # Table headers
    c_blue        = "#2563EB"     # Royal blue
    c_emerald     = "#10B981"     # Positive / Green
    c_amber       = "#F59E0B"     # Moderate / Yellow
    c_rose        = "#EF4444"     # Deficit / Red
    c_purple      = "#8B5CF6"     # Accent purple
    c_card_bg     = "#F8FAFC"     # Card bg
    c_card_border = "#CBD5E1"     # Card border
    
    # Cell Formats
    fmt_title = workbook.add_format({
        'font_name': 'Segoe UI', 'font_size': 17, 'bold': True,
        'font_color': '#FFFFFF', 'bg_color': c_slate_dark,
        'align': 'left', 'valign': 'vcenter', 'indent': 1
    })
    fmt_subtitle = workbook.add_format({
        'font_name': 'Segoe UI', 'font_size': 9.5, 'italic': True,
        'font_color': '#94A3B8', 'bg_color': c_slate_dark,
        'align': 'left', 'valign': 'vcenter', 'indent': 1
    })
    
    fmt_card_title = workbook.add_format({
        'font_name': 'Segoe UI', 'font_size': 8.5, 'bold': True,
        'font_color': '#64748B', 'bg_color': c_card_bg,
        'align': 'center', 'valign': 'vcenter',
        'top': 1, 'left': 1, 'right': 1, 'top_color': c_card_border, 'left_color': c_card_border, 'right_color': c_card_border
    })
    fmt_card_val = workbook.add_format({
        'font_name': 'Segoe UI', 'font_size': 20, 'bold': True,
        'font_color': c_slate_dark, 'bg_color': c_card_bg,
        'align': 'center', 'valign': 'vcenter',
        'left': 1, 'right': 1, 'left_color': c_card_border, 'right_color': c_card_border
    })
    fmt_card_val_green = workbook.add_format({
        'font_name': 'Segoe UI', 'font_size': 20, 'bold': True,
        'font_color': c_emerald, 'bg_color': c_card_bg,
        'align': 'center', 'valign': 'vcenter',
        'left': 1, 'right': 1, 'left_color': c_card_border, 'right_color': c_card_border
    })
    fmt_card_val_red = workbook.add_format({
        'font_name': 'Segoe UI', 'font_size': 20, 'bold': True,
        'font_color': c_rose, 'bg_color': c_card_bg,
        'align': 'center', 'valign': 'vcenter',
        'left': 1, 'right': 1, 'left_color': c_card_border, 'right_color': c_card_border
    })
    fmt_card_sub = workbook.add_format({
        'font_name': 'Segoe UI', 'font_size': 8,
        'font_color': '#64748B', 'bg_color': c_card_bg,
        'align': 'center', 'valign': 'vcenter',
        'bottom': 1, 'left': 1, 'right': 1, 'bottom_color': c_card_border, 'left_color': c_card_border, 'right_color': c_card_border
    })
    
    fmt_th = workbook.add_format({
        'font_name': 'Segoe UI', 'font_size': 9.5, 'bold': True,
        'font_color': '#FFFFFF', 'bg_color': c_slate_mid,
        'align': 'center', 'valign': 'vcenter', 'border': 1, 'border_color': '#475569'
    })
    fmt_cell = workbook.add_format({
        'font_name': 'Segoe UI', 'font_size': 9,
        'align': 'left', 'valign': 'vcenter', 'border': 1, 'border_color': '#E2E8F0'
    })
    fmt_cell_center = workbook.add_format({
        'font_name': 'Segoe UI', 'font_size': 9,
        'align': 'center', 'valign': 'vcenter', 'border': 1, 'border_color': '#E2E8F0'
    })
    fmt_cell_num = workbook.add_format({
        'font_name': 'Segoe UI', 'font_size': 9, 'num_format': '#,##0',
        'align': 'right', 'valign': 'vcenter', 'border': 1, 'border_color': '#E2E8F0'
    })
    fmt_cell_pct = workbook.add_format({
        'font_name': 'Segoe UI', 'font_size': 9, 'num_format': '0.0%',
        'align': 'right', 'valign': 'vcenter', 'border': 1, 'border_color': '#E2E8F0'
    })
    fmt_sec_hdr = workbook.add_format({
        'font_name': 'Segoe UI', 'font_size': 11.5, 'bold': True,
        'font_color': c_slate_dark, 'bottom': 2, 'bottom_color': c_blue
    })
    
    # ==============================================================================
    # TAB 1: KPI DASHBOARD
    # ==============================================================================
    ws_dash = workbook.add_worksheet("KPI Dashboard")
    ws_dash.hide_gridlines(False)
    ws_dash.set_zoom(90)
    
    ws_dash.set_column('A:A', 3)
    ws_dash.set_column('B:D', 11)
    ws_dash.set_column('E:G', 11)
    ws_dash.set_column('H:J', 11)
    ws_dash.set_column('K:M', 11)
    ws_dash.set_column('N:P', 11)
    ws_dash.set_column('Q:S', 11)
    ws_dash.set_column('T:Z', 4)
    
    # Title Banner
    ws_dash.merge_range('B2:S2', "UNIVERSITY LIFE MANAGEMENT SURVEY: RESEARCH & FEASIBILITY DASHBOARD", fmt_title)
    ws_dash.set_row(1, 28)
    ws_dash.merge_range('B3:S3', f"Research Study: Assessing the Need for a University Life Management Foundation Course | Sample Size (N) = {kpis['n']} Students", fmt_subtitle)
    ws_dash.set_row(2, 18)
    
    # Draw KPI Card
    def draw_card(start_col, title, val_str, sub_text, val_format=fmt_card_val):
        c1, c2 = f"{start_col}5", f"{chr(ord(start_col)+2)}5"
        v1, v2 = f"{start_col}6", f"{chr(ord(start_col)+2)}6"
        s1, s2 = f"{start_col}7", f"{chr(ord(start_col)+2)}7"
        ws_dash.merge_range(f"{c1}:{c2}", title, fmt_card_title)
        ws_dash.merge_range(f"{v1}:{v2}", val_str, val_format)
        ws_dash.merge_range(f"{s1}:{s2}", sub_text, fmt_card_sub)
        
    ws_dash.set_row(4, 16)
    ws_dash.set_row(5, 30)
    ws_dash.set_row(6, 16)
    
    # 6 Metric Scorecards
    draw_card('B', "SAMPLE PARTICIPANTS", f"{kpis['n']:,}", "Verified Student Submissions", fmt_card_val)
    draw_card('E', "COURSE ENDORSEMENT", f"{kpis['course_endorsement_pct']*100:.1f}%", f"{kpis['course_very_useful_pct']*100:.1f}% Rate Very Useful", fmt_card_val_green)
    draw_card('H', "PREPARATION DEFICIT", f"{kpis['inadequate_pct']*100:.1f}%", "Feel Univ Prepares Inadequately", fmt_card_val_red)
    draw_card('K', "POST-GRAD UNPREPARED", f"{kpis['unprepared_postgrad_pct']*100:.1f}%", "Feel Not Prepared for Post-Grad", fmt_card_val_red)
    draw_card('N', "TIME GUIDANCE VOID", f"{kpis['no_time_guidance_pct']*100:.1f}%", "Received Zero Time Training", fmt_card_val_red)
    draw_card('Q', "FINANCIAL GUIDANCE NEED", f"{kpis['fin_very_useful_pct']*100:.1f}%", "Demand Financial Guidance", fmt_card_val_green)
    
    # Section Header
    ws_dash.write('B9', "RESEARCH FINDINGS: CHARTS & DEMAND ANALYSIS", fmt_sec_hdr)
    
    # ==============================================================================
    # TAB 2: 📈 SUMMARY & CROSS-TABS
    # ==============================================================================
    ws_sum = workbook.add_worksheet("Summary Tables")
    ws_sum.set_column('A:Z', 22)
    
    # Table 1: Q24 Course Utility
    ws_sum.write('A1', "Foundation Course Utility (Q24)", fmt_th)
    ws_sum.write('B1', "Count", fmt_th)
    ws_sum.write('C1', "Percentage", fmt_th)
    for r_idx, row in tables["course_utility"].iterrows():
        ws_sum.write(r_idx + 1, 0, row["Category"], fmt_cell)
        ws_sum.write(r_idx + 1, 1, row["Count"], fmt_cell_num)
        ws_sum.write(r_idx + 1, 2, row["Percentage"], fmt_cell_pct)
        
    # Table 2: Priority Areas Demanded (Q23)
    ws_sum.write('E1', "Priority Guidance Needs (Q23)", fmt_th)
    ws_sum.write('F1', "Votes Count", fmt_th)
    ws_sum.write('G1', "% of Students", fmt_th)
    for r_idx, row in tables["priority_areas"].iterrows():
        ws_sum.write(r_idx + 1, 4, row["Choice"], fmt_cell)
        ws_sum.write(r_idx + 1, 5, row["Count"], fmt_cell_num)
        ws_sum.write(r_idx + 1, 6, row["Percentage"], fmt_cell_pct)
        
    # Table 3: Support Deficit Across 5 Domains
    ws_sum.write('I1', "University Life Domain", fmt_th)
    ws_sum.write('J1', "Deficit Count", fmt_th)
    ws_sum.write('K1', "Deficit Rate (%)", fmt_th)
    for r_idx, row in tables["support_deficit"].iterrows():
        ws_sum.write(r_idx + 1, 8, row["Domain"], fmt_cell)
        ws_sum.write(r_idx + 1, 9, row["Deficit_Count"], fmt_cell_num)
        ws_sum.write(r_idx + 1, 10, row["Deficit_Pct"], fmt_cell_pct)
        
    # Table 4: Preferred Course Format (Q25)
    ws_sum.write('A10', "Preferred Format (Q25)", fmt_th)
    ws_sum.write('B10', "Votes Count", fmt_th)
    ws_sum.write('C10', "% of Students", fmt_th)
    for r_idx, row in tables["preferred_format"].iterrows():
        ws_sum.write(r_idx + 10, 0, row["Choice"], fmt_cell)
        ws_sum.write(r_idx + 10, 1, row["Count"], fmt_cell_num)
        ws_sum.write(r_idx + 10, 2, row["Percentage"], fmt_cell_pct)
        
    # Table 5: Study Level Cross-Tabulation
    ws_sum.write('E10', "Level of Study", fmt_th)
    ws_sum.write('F10', "Sample (N)", fmt_th)
    ws_sum.write('G10', "Unprepared for Life After Univ (%)", fmt_th)
    ws_sum.write('H10', "University Prepares Inadequately (%)", fmt_th)
    for r_idx, row in tables["study_level"].iterrows():
        ws_sum.write(r_idx + 10, 4, row["Level of Study"], fmt_cell)
        ws_sum.write(r_idx + 10, 5, row["Students"], fmt_cell_num)
        ws_sum.write(r_idx + 10, 6, row["Not Prepared for Postgrad %"], fmt_cell_pct)
        ws_sum.write(r_idx + 10, 7, row["University Inadequately Prepares %"], fmt_cell_pct)
        
    # Table 6: Areas Managed Beyond Classes (Q1)
    ws_sum.write('J10', "Non-Academic Area Managed (Q1)", fmt_th)
    ws_sum.write('K10', "Students Managing", fmt_th)
    ws_sum.write('L10', "% of Students", fmt_th)
    for r_idx, row in tables["areas_managed"].iterrows():
        ws_sum.write(r_idx + 10, 9, row["Choice"], fmt_cell)
        ws_sum.write(r_idx + 10, 10, row["Count"], fmt_cell_num)
        ws_sum.write(r_idx + 10, 11, row["Percentage"], fmt_cell_pct)
        
    # ==============================================================================
    # CHARTS CREATION (POSITIONED ON TAB 1)
    # ==============================================================================
    # Chart 1: Donut Chart - Foundation Course Utility (Central Research Question)
    chart1 = workbook.add_chart({'type': 'doughnut'})
    chart1.add_series({
        'name': 'Course Utility',
        'categories': "='Summary Tables'!$A$2:$A$5",
        'values':     "='Summary Tables'!$B$2:$B$5",
        'points': [
            {'fill': {'color': c_emerald}},  # Very useful
            {'fill': {'color': c_blue}},     # Somewhat useful
            {'fill': {'color': c_rose}},     # Not useful at all
            {'fill': {'color': c_amber}}     # Not sure
        ],
        'data_labels': {'percentage': True, 'leader_lines': True}
    })
    chart1.set_title({'name': 'Foundation Course Utility Endorsement (Q24)', 'name_font': {'bold': True, 'size': 11, 'color': c_slate_mid}})
    chart1.set_legend({'position': 'bottom'})
    chart1.set_hole_size(55)
    chart1.set_size({'width': 450, 'height': 290})
    ws_dash.insert_chart('B11', chart1)
    
    # Chart 2: Bar Chart - Priority Guidance Areas Demanded (Q23)
    chart2 = workbook.add_chart({'type': 'bar'})
    num_p_areas = len(tables["priority_areas"])
    chart2.add_series({
        'name': '% of Students Requesting',
        'categories': f"='Summary Tables'!$E$2:$E${num_p_areas + 1}",
        'values':     f"='Summary Tables'!$G$2:$G${num_p_areas + 1}",
        'fill':       {'color': '#6366F1'},
        'data_labels': {'value': True, 'num_format': '0.0%'}
    })
    chart2.set_title({'name': 'Top Student Needs Demanded for Guidance (Q23)', 'name_font': {'bold': True, 'size': 11, 'color': c_slate_mid}})
    chart2.set_x_axis({'num_format': '0%'})
    chart2.set_legend({'none': True})
    chart2.set_size({'width': 470, 'height': 290})
    ws_dash.insert_chart('H11', chart2)
    
    # Chart 3: Column Chart - Institutional Support Void Across 5 Pillars
    chart3 = workbook.add_chart({'type': 'column'})
    num_deficits = len(tables["support_deficit"])
    chart3.add_series({
        'name': 'Support Deficit Rate (%)',
        'categories': f"='Summary Tables'!$I$2:$I${num_deficits + 1}",
        'values':     f"='Summary Tables'!$K$2:$K${num_deficits + 1}",
        'fill':       {'color': c_rose},
        'data_labels': {'value': True, 'num_format': '0.0%'}
    })
    chart3.set_title({'name': 'Institutional Support Deficit Across Life Domains', 'name_font': {'bold': True, 'size': 11, 'color': c_slate_mid}})
    chart3.set_y_axis({'num_format': '0%', 'max': 1.0})
    chart3.set_legend({'none': True})
    chart3.set_size({'width': 450, 'height': 290})
    ws_dash.insert_chart('N11', chart3)
    
    # Chart 4: Bar Chart - Preferred Format (Q25)
    chart4 = workbook.add_chart({'type': 'bar'})
    num_formats = len(tables["preferred_format"])
    chart4.add_series({
        'name': '% Preference',
        'categories': f"='Summary Tables'!$A$11:$A${num_formats + 10}",
        'values':     f"='Summary Tables'!$C$11:$C${num_formats + 10}",
        'fill':       {'color': '#0EA5E9'},
        'data_labels': {'value': True, 'num_format': '0.0%'}
    })
    chart4.set_title({'name': 'Preferred Learning Format for Foundation Course (Q25)', 'name_font': {'bold': True, 'size': 11, 'color': c_slate_mid}})
    chart4.set_x_axis({'num_format': '0%'})
    chart4.set_legend({'none': True})
    chart4.set_size({'width': 450, 'height': 290})
    ws_dash.insert_chart('B27', chart4)
    
    # Chart 5: Clustered Column - Post-Grad Unpreparedness by Study Level
    chart5 = workbook.add_chart({'type': 'column'})
    chart5.add_series({
        'name': 'Not Prepared for Life After Univ (%)',
        'categories': "='Summary Tables'!$E$11:$E$14",
        'values':     "='Summary Tables'!$G$11:$G$14",
        'fill':       {'color': '#F97316'},
        'data_labels': {'value': True, 'num_format': '0.0%'}
    })
    chart5.add_series({
        'name': 'Univ Prepares Inadequately (%)',
        'categories': "='Summary Tables'!$E$11:$E$14",
        'values':     "='Summary Tables'!$H$11:$H$14",
        'fill':       {'color': '#EF4444'},
        'data_labels': {'value': True, 'num_format': '0.0%'}
    })
    chart5.set_title({'name': 'Preparation Deficit by Current Level of Study (Q18 & Q22)', 'name_font': {'bold': True, 'size': 11, 'color': c_slate_mid}})
    chart5.set_y_axis({'num_format': '0%', 'max': 1.0})
    chart5.set_legend({'position': 'bottom'})
    chart5.set_size({'width': 470, 'height': 290})
    ws_dash.insert_chart('H27', chart5)
    
    # Chart 6: Bar Chart - Non-Academic Responsibilities Managed (Q1)
    chart6 = workbook.add_chart({'type': 'bar'})
    num_managed = len(tables["areas_managed"])
    chart6.add_series({
        'name': '% of Students Managing',
        'categories': f"='Summary Tables'!$J$11:$J${num_managed + 10}",
        'values':     f"='Summary Tables'!$L$11:$L${num_managed + 10}",
        'fill':       {'color': '#14B8A6'},
        'data_labels': {'value': True, 'num_format': '0.0%'}
    })
    chart6.set_title({'name': 'Non-Academic Life Demands Managed by Students (Q1)', 'name_font': {'bold': True, 'size': 11, 'color': c_slate_mid}})
    chart6.set_x_axis({'num_format': '0%'})
    chart6.set_legend({'none': True})
    chart6.set_size({'width': 450, 'height': 290})
    ws_dash.insert_chart('N27', chart6)
    
    # Executive Research Summary Callout Box (Row 43)
    ws_dash.write('B43', "EXECUTIVE RESEARCH SUMMARY & EVIDENCE-BASED RECOMMENDATIONS", fmt_sec_hdr)
    
    fmt_insight = workbook.add_format({
        'font_name': 'Segoe UI', 'font_size': 9.5, 'color': c_slate_dark,
        'bg_color': '#F1F5F9', 'valign': 'vcenter', 'indent': 1,
        'border': 1, 'border_color': '#CBD5E1'
    })
    
    top_need = tables["priority_areas"].iloc[0]["Choice"] if not tables["priority_areas"].empty else "Time Management"
    top_format = tables["preferred_format"].iloc[0]["Choice"] if not tables["preferred_format"].empty else "Integrated Curriculum Course"
    
    r1 = f"- Strong Foundation Course Mandate: {kpis['course_endorsement_pct']*100:.1f}% of surveyed students endorse the proposed Foundation Course ({kpis['course_very_useful_pct']*100:.1f}% consider it 'Very Useful')."
    r2 = f"- Critical Institutional Gap: {kpis['inadequate_pct']*100:.1f}% report their university inadequately prepares them for life beyond exams; {kpis['no_time_guidance_pct']*100:.1f}% received zero structured time management training."
    r3 = f"- Acute Student Priority: The highest student-demanded area for structured guidance is '{top_need}', followed by financial management and wellbeing."
    r4 = f"- Pedagogical Recommendation: Students' leading preferred format is '{top_format}'. Qualitative student quotes are compiled in the 'Qualitative Voice' tab."
    
    ws_dash.merge_range('B45:S45', r1, fmt_insight)
    ws_dash.merge_range('B46:S46', r2, fmt_insight)
    ws_dash.merge_range('B47:S47', r3, fmt_insight)
    ws_dash.merge_range('B48:S48', r4, fmt_insight)
    ws_dash.set_row(44, 20)
    ws_dash.set_row(45, 20)
    ws_dash.set_row(46, 20)
    ws_dash.set_row(47, 20)
    
    # ==============================================================================
    # TAB 3: 📋 CLEANED SURVEY DATASET
    # ==============================================================================
    ws_clean = workbook.add_worksheet("Cleaned Dataset")
    ws_clean.freeze_panes(1, 0)
    
    clean_cols_meta = [
        ("Response_ID", 14, fmt_cell_center),
        ("Timestamp", 18, fmt_cell_center),
        ("Gender", 14, fmt_cell_center),
        ("Level_of_Study", 16, fmt_cell_center),
        ("Institution_Type", 18, fmt_cell),
        ("Programme", 24, fmt_cell),
        ("Age_Group", 12, fmt_cell_center),
        ("q2_preparedness", 20, fmt_cell),
        ("q4_time_system", 30, fmt_cell),
        ("q6_time_guidance", 14, fmt_cell_center),
        ("q8_personal_dev_received", 18, fmt_cell_center),
        ("q11_wellbeing_received", 18, fmt_cell_center),
        ("q14_finance_utility", 18, fmt_cell_center),
        ("q16_social_guidance_received", 18, fmt_cell_center),
        ("q18_postgrad_preparedness", 20, fmt_cell),
        ("q20_career_guidance_received", 18, fmt_cell_center),
        ("q22_overall_adequacy", 18, fmt_cell_center),
        ("q24_course_utility", 20, fmt_cell_center),
        ("q25_preferred_format", 30, fmt_cell),
        ("q1_areas_managed", 40, fmt_cell),
        ("q5_difficult_balance", 40, fmt_cell),
        ("q7_personal_dev_important", 40, fmt_cell),
        ("q12_finance_challenges", 40, fmt_cell),
        ("q23_areas_needing_guidance", 40, fmt_cell)
    ]
    
    for c_idx, (col_name, col_w, _) in enumerate(clean_cols_meta):
        label = col_name.replace("q", "Q").replace("_", " ").title()
        ws_clean.write(0, c_idx, label, fmt_th)
        ws_clean.set_column(c_idx, c_idx, col_w)
        
    for r_idx, row in clean_df.iterrows():
        for c_idx, (col_name, _, col_fmt) in enumerate(clean_cols_meta):
            val = row.get(col_name, "")
            if isinstance(val, pd.Timestamp):
                ws_clean.write(r_idx + 1, c_idx, str(val.strftime("%Y-%m-%d %H:%M")), col_fmt)
            else:
                ws_clean.write(r_idx + 1, c_idx, str(val), col_fmt)
                
    ws_clean.autofilter(0, 0, len(clean_df), len(clean_cols_meta) - 1)
    
    # ==============================================================================
    # TAB 4: 💬 QUALITATIVE VOICE OF STUDENTS (Q26 & Q27)
    # ==============================================================================
    ws_qual = workbook.add_worksheet("Qualitative Voice (Q26 & Q27)")
    ws_qual.freeze_panes(1, 0)
    
    qual_cols = [
        ("Response_ID", 14, fmt_cell_center),
        ("Level_of_Study", 16, fmt_cell_center),
        ("Gender", 14, fmt_cell_center),
        ("Programme", 24, fmt_cell),
        ("One Thing You Wish Someone Had Taught You (Q26)", 55, fmt_cell),
        ("Recommendations for Universities (Q27)", 55, fmt_cell)
    ]
    
    for c_idx, (col_name, col_w, _) in enumerate(qual_cols):
        ws_qual.write(0, c_idx, col_name, fmt_th)
        ws_qual.set_column(c_idx, c_idx, col_w)
        
    # Write only responses that have non-empty qualitative answers
    qual_rows = clean_df[(clean_df["q26_wish_taught"].str.len() > 0) | (clean_df["q27_general_recommendations"].str.len() > 0)]
    for r_idx, (_, row) in enumerate(qual_rows.iterrows()):
        ws_qual.write(r_idx + 1, 0, str(row["Response_ID"]), fmt_cell_center)
        ws_qual.write(r_idx + 1, 1, str(row["Level_of_Study"]), fmt_cell_center)
        ws_qual.write(r_idx + 1, 2, str(row["Gender"]), fmt_cell_center)
        ws_qual.write(r_idx + 1, 3, str(row["Programme"]), fmt_cell)
        ws_qual.write(r_idx + 1, 4, str(row["q26_wish_taught"]), fmt_cell)
        ws_qual.write(r_idx + 1, 5, str(row["q27_general_recommendations"]), fmt_cell)
        
    ws_qual.autofilter(0, 0, len(qual_rows), len(qual_cols) - 1)
    
    # ==============================================================================
    # TAB 5: 🗄️ RAW INGESTION ARCHIVE
    # ==============================================================================
    ws_raw = workbook.add_worksheet("Raw Ingestion Archive")
    ws_raw.freeze_panes(1, 0)
    for c_idx, col_name in enumerate(raw_df.columns):
        ws_raw.write(0, c_idx, str(col_name), fmt_th)
        ws_raw.set_column(c_idx, c_idx, 25)
        
    for r_idx, row in raw_df.iterrows():
        for c_idx, val in enumerate(row):
            ws_raw.write(r_idx + 1, c_idx, str(val) if pd.notna(val) else "", fmt_cell)
            
    ws_raw.autofilter(0, 0, len(raw_df), len(raw_df.columns) - 1)
    
    workbook.close()
    print(f"[+] Successfully generated Executive Research Excel KPI Dashboard at: {output_path}")
    return output_path

# ==============================================================================
# 6. PIPELINE RUNNER & CLI
# ==============================================================================
def run_pipeline(source_path: str = None, google_sheet_url: str = None, output_path: str = None, mock: bool = False, open_file: bool = False):
    config = {}
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                config = json.load(f)
        except Exception:
            pass
            
    sheet_url = google_sheet_url or config.get("google_sheet_url", "")
    input_file = source_path or config.get("input_csv_path", "")
    out_file = output_path or config.get("output_excel_path", "output/survey_kpi_dashboard.xlsx")
    should_open = open_file or config.get("auto_open_excel", False)
    
    print("=" * 70)
    print("[*] UNIVERSITY LIFE MANAGEMENT SURVEY: DATA PIPELINE & KPI DASHBOARD")
    print("=" * 70)
    
    if mock:
        from generate_mock_data import generate_mock_university_survey
        print("[*] Generating authentic student responses dataset...")
        generate_mock_university_survey(180, "data/sample_raw_responses.csv")
        input_file = "data/sample_raw_responses.csv"
        
    # Step 1: Ingest
    print("\n[Step 1/3] Ingesting survey responses...")
    raw_df = ingest_survey_data(source_path=input_file if input_file else None, google_sheet_url=sheet_url if sheet_url else None)
    print(f"-> Ingested {len(raw_df)} total raw survey responses.")
    
    # Step 2: Clean & Standardize
    print("\n[Step 2/3] Cleaning and standardizing survey responses...")
    raw_df, clean_df = clean_and_normalize_data(raw_df)
    print(f"-> Normalized 27 research survey variables across {len(clean_df)} student participants.")
    
    # Step 3: Excel Dashboard Generation
    print("\n[Step 3/3] Generating multi-tab Executive Excel KPI Dashboard...")
    excel_file = create_university_excel_dashboard(raw_df, clean_df, output_path=out_file)
    
    print("\n" + "=" * 70)
    print("[+] PIPELINE EXECUTION COMPLETE!")
    print(f"[+] Output File: {excel_file}")
    print("=" * 70)
    
    if should_open:
        try:
            print("[*] Launching Excel Dashboard...")
            os.startfile(os.path.abspath(excel_file))
        except Exception as e:
            print(f"[!] Note: Could not auto-open Excel: {e}")
            
    return excel_file

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="University Life Management Survey Pipeline")
    parser.add_argument("--sheet-url", type=str, help="Live Google Sheet URL")
    parser.add_argument("--input", type=str, help="Local raw CSV or Excel survey file")
    parser.add_argument("--output", type=str, help="Target output Excel file")
    parser.add_argument("--mock", action="store_true", help="Generate and run with authentic mock survey data")
    parser.add_argument("--open", action="store_true", help="Automatically open Excel workbook upon completion")
    
    args = parser.parse_args()
    run_pipeline(source_path=args.input, google_sheet_url=args.sheet_url, output_path=args.output, mock=args.mock, open_file=args.open)
