"""
University Life Management Survey: Interactive Web KPI Dashboard
==================================================================
Built with Streamlit & Plotly.
Reads from 'output/survey_kpi_dashboard.xlsx' or 'data/sample_raw_responses.csv'.
"""

import os
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from pipeline import clean_and_normalize_data, compute_research_kpis_and_tables, ingest_survey_data

st.set_page_config(
    page_title="University Life Management Survey - KPI Dashboard",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for executive polish
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
        color: white;
        padding: 24px;
        border-radius: 12px;
        margin-bottom: 24px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .kpi-card {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 10px;
        padding: 18px;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .kpi-title {
        font-size: 0.85rem;
        font-weight: 600;
        color: #64748B;
        text-transform: uppercase;
        margin-bottom: 6px;
    }
    .kpi-val {
        font-size: 1.8rem;
        font-weight: 700;
        margin-bottom: 4px;
    }
    .kpi-sub {
        font-size: 0.8rem;
        color: #94A3B8;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_data
def load_data():
    raw = ingest_survey_data()
    _, clean = clean_and_normalize_data(raw)
    return raw, clean

try:
    raw_df, clean_df = load_data()
except Exception as e:
    st.error(f"Error loading survey responses: {e}")
    st.stop()

# ==============================================================================
# SIDEBAR FILTERS
# ==============================================================================
with st.sidebar:
    st.image("https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80", use_container_width=True)
    st.title("🎓 Filter Responses")
    
    study_levels = ["All"] + list(clean_df["Level_of_Study"].unique())
    selected_level = st.selectbox("Current Level of Study", study_levels)
    
    inst_types = ["All"] + list(clean_df["Institution_Type"].unique())
    selected_inst = st.selectbox("Type of Institution", inst_types)
    
    genders = ["All"] + list(clean_df["Gender"].unique())
    selected_gender = st.selectbox("Gender", genders)
    
    st.markdown("---")
    st.caption("Data Pipeline: Google Forms → Clean Excel / Web Dashboard")
    if st.button("🔄 Reload Latest Responses"):
        st.cache_data.clear()
        st.rerun()

# Apply Filters
filtered_df = clean_df.copy()
if selected_level != "All":
    filtered_df = filtered_df[filtered_df["Level_of_Study"] == selected_level]
if selected_inst != "All":
    filtered_df = filtered_df[filtered_df["Institution_Type"] == selected_inst]
if selected_gender != "All":
    filtered_df = filtered_df[filtered_df["Gender"] == selected_gender]

if len(filtered_df) == 0:
    st.warning("No survey responses match the selected filters.")
    st.stop()

kpis, tables = compute_research_kpis_and_tables(filtered_df)

# ==============================================================================
# HEADER BANNER
# ==============================================================================
st.markdown(f"""
<div class="main-header">
    <h2 style="margin: 0; font-weight: 700;">University Life Management Survey: Research Dashboard</h2>
    <p style="margin: 6px 0 0 0; color: #94A3B8; font-size: 0.95rem;">
        Research Topic: Assessing the Need for a University Life Management Foundation Course • Sample Size (N) = {kpis['n']} Students
    </p>
</div>
""", unsafe_allow_html=True)

# ==============================================================================
# KPI SCORECARDS
# ==============================================================================
c1, c2, c3, c4, c5, c6 = st.columns(6)

with c1:
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-title">Sample Size (N)</div>
        <div class="kpi-val" style="color: #0F172A;">{kpis['n']}</div>
        <div class="kpi-sub">Students Surveyed</div>
    </div>
    """, unsafe_allow_html=True)

with c2:
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-title">Course Endorsement</div>
        <div class="kpi-val" style="color: #10B981;">{kpis['course_endorsement_pct']*100:.1f}%</div>
        <div class="kpi-sub">{kpis['course_very_useful_pct']*100:.1f}% Very Useful</div>
    </div>
    """, unsafe_allow_html=True)

with c3:
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-title">Preparation Deficit</div>
        <div class="kpi-val" style="color: #EF4444;">{kpis['inadequate_pct']*100:.1f}%</div>
        <div class="kpi-sub">Inadequately Prepared</div>
    </div>
    """, unsafe_allow_html=True)

with c4:
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-title">Post-Grad Unprepared</div>
        <div class="kpi-val" style="color: #EF4444;">{kpis['unprepared_postgrad_pct']*100:.1f}%</div>
        <div class="kpi-sub">Anxious / Unprepared</div>
    </div>
    """, unsafe_allow_html=True)

with c5:
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-title">Zero Time Training</div>
        <div class="kpi-val" style="color: #F97316;">{kpis['no_time_guidance_pct']*100:.1f}%</div>
        <div class="kpi-sub">No University Guidance</div>
    </div>
    """, unsafe_allow_html=True)

with c6:
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-title">Financial Need</div>
        <div class="kpi-val" style="color: #2563EB;">{kpis['fin_very_useful_pct']*100:.1f}%</div>
        <div class="kpi-sub">Rate Very Useful</div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# ==============================================================================
# MAIN TABS
# ==============================================================================
tab_dash, tab_qual, tab_data = st.tabs(["📊 Analytics & Research Charts", "💬 Qualitative Voice of Students (Q26 & Q27)", "📋 Cleaned Dataset"])

with tab_dash:
    # ROW 1: Central Question & Priority Needs
    r1_col1, r1_col2 = st.columns(2)
    
    with r1_col1:
        # Donut Chart for Q24
        df_q24 = tables["course_utility"]
        fig_q24 = px.pie(
            df_q24,
            names="Category",
            values="Count",
            title="<b>Central Research Question (Q24): Foundation Course Utility</b>",
            hole=0.55,
            color="Category",
            color_discrete_map={
                "Very useful": "#10B981",
                "Somewhat useful": "#2563EB",
                "Not useful at all": "#EF4444",
                "I'm not sure": "#F59E0B"
            }
        )
        fig_q24.update_traces(textposition='inside', textinfo='percent+label')
        fig_q24.update_layout(margin=dict(t=50, b=20, l=20, r=20), height=360)
        st.plotly_chart(fig_q24, use_container_width=True)
        
    with r1_col2:
        # Priority Needs (Q23)
        df_q23 = tables["priority_areas"].sort_values(by="Percentage", ascending=True)
        fig_q23 = px.bar(
            df_q23,
            x="Percentage",
            y="Choice",
            orientation="h",
            title="<b>Priority Student Areas Demanded for Structured Guidance (Q23)</b>",
            text=df_q23["Percentage"].apply(lambda p: f"{p*100:.1f}%"),
            color="Percentage",
            color_continuous_scale="Purples"
        )
        fig_q23.update_layout(xaxis=dict(tickformat=".0%"), showlegend=False, height=360, margin=dict(t=50, b=20, l=20, r=20))
        st.plotly_chart(fig_q23, use_container_width=True)
        
    # ROW 2: Support Deficit Across Pillars & Preferred Formats
    r2_col1, r2_col2 = st.columns(2)
    
    with r2_col1:
        df_def = tables["support_deficit"]
        fig_def = px.bar(
            df_def,
            x="Domain",
            y="Deficit_Pct",
            title="<b>Institutional Guidance Deficit Across Life Domains (% None / Very Little)</b>",
            text=df_def["Deficit_Pct"].apply(lambda p: f"{p*100:.1f}%"),
            color_discrete_sequence=["#EF4444"]
        )
        fig_def.update_layout(yaxis=dict(tickformat=".0%", range=[0, 1]), height=360, margin=dict(t=50, b=50, l=20, r=20))
        fig_def.update_xaxes(tickangle=-25)
        st.plotly_chart(fig_def, use_container_width=True)
        
    with r2_col2:
        df_fmt = tables["preferred_format"].sort_values(by="Percentage", ascending=True)
        fig_fmt = px.bar(
            df_fmt,
            x="Percentage",
            y="Choice",
            orientation="h",
            title="<b>Preferred Learning Format for the Foundation Course (Q25)</b>",
            text=df_fmt["Percentage"].apply(lambda p: f"{p*100:.1f}%"),
            color_discrete_sequence=["#0EA5E9"]
        )
        fig_fmt.update_layout(xaxis=dict(tickformat=".0%"), height=360, margin=dict(t=50, b=20, l=20, r=20))
        st.plotly_chart(fig_fmt, use_container_width=True)
        
    # ROW 3: Cross-Tab by Year of Study & Non-Academic Demands
    r3_col1, r3_col2 = st.columns(2)
    
    with r3_col1:
        df_lvl = tables["study_level"]
        fig_lvl = go.Figure(data=[
            go.Bar(name='Unprepared for Life After Univ', x=df_lvl['Level of Study'], y=df_lvl['Not Prepared for Postgrad %'], marker_color='#F97316'),
            go.Bar(name='Univ Prepares Inadequately', x=df_lvl['Level of Study'], y=df_lvl['University Inadequately Prepares %'], marker_color='#EF4444')
        ])
        fig_lvl.update_layout(
            barmode='group',
            title="<b>Preparedness Gaps by Current Level of Study (Q18 & Q22)</b>",
            yaxis=dict(tickformat=".0%", range=[0, 1]),
            height=360,
            margin=dict(t=50, b=20, l=20, r=20),
            legend=dict(orientation="h", yanchor="bottom", y=-0.3, xanchor="center", x=0.5)
        )
        st.plotly_chart(fig_lvl, use_container_width=True)
        
    with r3_col2:
        df_man = tables["areas_managed"].sort_values(by="Percentage", ascending=True)
        fig_man = px.bar(
            df_man,
            x="Percentage",
            y="Choice",
            orientation="h",
            title="<b>Non-Academic Areas Managed by Students Beyond Classes (Q1)</b>",
            text=df_man["Percentage"].apply(lambda p: f"{p*100:.1f}%"),
            color_discrete_sequence=["#14B8A6"]
        )
        fig_man.update_layout(xaxis=dict(tickformat=".0%"), height=360, margin=dict(t=50, b=20, l=20, r=20))
        st.plotly_chart(fig_man, use_container_width=True)

with tab_qual:
    st.subheader("💬 Qualitative Voice of Students")
    st.write("Verbatim responses expressing student desires and systemic recommendations for university leadership.")
    
    qual_df = filtered_df[(filtered_df["q26_wish_taught"].str.len() > 0) | (filtered_df["q27_general_recommendations"].str.len() > 0)]
    
    col_q1, col_q2 = st.columns(2)
    with col_q1:
        search_kw = st.text_input("🔍 Search quotes by keyword", "")
    with col_q2:
        st.write(f"Showing **{len(qual_df)}** qualitative responses")
        
    if search_kw:
        qual_df = qual_df[
            qual_df["q26_wish_taught"].str.contains(search_kw, case=False, na=False) |
            qual_df["q27_general_recommendations"].str.contains(search_kw, case=False, na=False)
        ]
        
    for _, row in qual_df.iterrows():
        with st.expander(f"🎓 {row['Level_of_Study']} • {row['Programme']} ({row['Institution_Type']})"):
            if row["q26_wish_taught"]:
                st.markdown(f"**One thing I wish someone had taught me (Q26):**\n> *\"{row['q26_wish_taught']}\"*")
            if row["q27_general_recommendations"]:
                st.markdown(f"**Recommendation for Universities (Q27):**\n> *\"{row['q27_general_recommendations']}\"*")

with tab_data:
    st.subheader("📋 Cleaned Survey Records")
    st.dataframe(filtered_df, use_container_width=True)
    csv = filtered_df.to_csv(index=False).encode('utf-8')
    st.download_button(
        label="📥 Download Filtered Data as CSV",
        data=csv,
        file_name="cleaned_university_survey_data.csv",
        mime="text/csv",
    )
