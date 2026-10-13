/**
 * UNIVERSITY LIFE MANAGEMENT SURVEY - GOOGLE SHEET WEBHOOK SCRIPT
 * ===============================================================
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Sheet (where you want survey responses saved).
 * 2. In the top menu, click: Extensions > Apps Script.
 * 3. Delete any code in the editor, and paste this entire code below.
 * 4. Click the Save icon (floppy disk).
 * 5. Click the blue "Deploy" button (top right) > "New deployment".
 * 6. Click the gear icon next to "Select type" > choose "Web app".
 * 7. Set the fields:
 *      - Description: Survey Webhook
 *      - Execute as: Me (your Google account)
 *      - Who has access: Anyone   <--- (CRITICAL! Do NOT choose "Only myself")
 * 8. Click "Deploy", approve permissions if Google asks, and copy the Web App URL:
 *      https://script.google.com/macros/s/.../exec
 * 9. Paste that URL into your Survey Dashboard ("Connect Google Sheet" modal).
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Automatically initialize header row on row 1 if sheet is blank
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Response ID",
        "Name",
        "Gender",
        "Level of Study",
        "Institution Type",
        "Programme / Field of Study",
        "Age Group",
        "Q1. Areas Managed Beyond Coursework",
        "Q2. Overall Preparedness",
        "Q3. How Skills Were Learned",
        "Q4. Current Time Management Approach",
        "Q5. Difficult Areas to Balance",
        "Q6. Time Management Guidance Received",
        "Q7. Important Personal Development Areas",
        "Q8. Personal Development Guidance Received",
        "Q9. Desired Personal Development Guidance",
        "Q10. Stress Coping Strategies",
        "Q11. University Wellbeing Guidance",
        "Q12. Financial Management Challenges",
        "Q13. Financial Knowledge Sources",
        "Q14. Financial Guidance Utility",
        "Q15. Student & Social Life Managed",
        "Q16. University Social/Activity Guidance",
        "Q17. Desired Social/Relationship Guidance",
        "Q18. Post-Graduation Preparedness",
        "Q19. Career Guidance Desired",
        "Q20. University Career Guidance Received",
        "Q21. Career Guidance Sources",
        "Q22. Overall University Adequacy",
        "Q23. Priority Areas Needing Guidance",
        "Q24. Foundation Course Utility (Central Question)",
        "Q25. Preferred Learning Format",
        "Q26. One Thing Wish Taught",
        "Q27. University Recommendations"
      ]);
      
      // Style headers: dark navy background, white bold text, freeze header
      var headerRange = sheet.getRange(1, 1, 1, 35);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#1E293B");
      headerRange.setFontColor("#FFFFFF");
      sheet.setFrozenRows(1);
    }
    
    // Append survey response row
    sheet.appendRow([
      data.Timestamp || new Date().toISOString(),
      data.Response_ID || "",
      data.Name || "Anonymous",
      data.Gender || "",
      data.Level_of_Study || "",
      data.Institution_Type || "",
      data.Programme || "",
      data.Age_Group || "",
      data.q1_areas_managed || "",
      data.q2_preparedness || "",
      data.q3_skills_source || "",
      data.q4_time_system || "",
      data.q5_difficult_balance || "",
      data.q6_time_guidance || "",
      data.q7_personal_dev_important || "",
      data.q8_personal_dev_received || "",
      data.q9_personal_dev_desired || "",
      data.q10_stress_coping || "",
      data.q11_wellbeing_received || "",
      data.q12_finance_challenges || "",
      data.q13_finance_source || "",
      data.q14_finance_utility || "",
      data.q15_social_involvement || "",
      data.q16_social_guidance_received || "",
      data.q17_social_guidance_desired || "",
      data.q18_postgrad_preparedness || "",
      data.q19_career_guidance_desired || "",
      data.q20_career_guidance_received || "",
      data.q21_career_source || "",
      data.q22_overall_adequacy || "",
      data.q23_areas_needing_guidance || "",
      data.q24_course_utility || "",
      data.q25_preferred_format || "",
      data.q26_wish_taught || "",
      data.q27_general_recommendations || ""
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Survey response saved to Google Sheet successfully!"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    message: "Google Sheet Survey Webhook is active and reachable!"
  })).setMimeType(ContentService.MimeType.JSON);
}
