/**
 * ==============================================================================
 * AUTOMATIC GOOGLE FORM BUILDER SCRIPT (Google Apps Script)
 * ==============================================================================
 * Research Topic: Assessing the Need for a University Life Management Foundation Course
 * 
 * HOW TO USE THIS SCRIPT TO CREATE YOUR GOOGLE FORM IN 10 SECONDS:
 * 1. Open your web browser and go to: https://script.google.com
 * 2. Click "New Project".
 * 3. Delete any default code in the editor, and paste this entire script.
 * 4. Click the "Save" icon (Floppy disk).
 * 5. Click "Run" (Play button) at the top.
 * 6. (First time only) Click "Review permissions" > choose your Google account > "Advanced" > "Go to Untitled project (unsafe)" > "Allow".
 * 7. Check the Execution Log at the bottom: It will output the Edit URL and Public Live URL of your newly created Google Form!
 * ==============================================================================
 */

function createUniversityLifeSurveyForm() {
  var form = FormApp.create("University Life Management Survey");
  
  form.setDescription(
    "Research Topic: Assessing the Need for a University Life Management Foundation Course: " +
    "Exploring Students’ Experiences, Challenges and Support Needs\n\n" +
    "Estimated completion time: 5 minutes\n\n" +
    "Introduction:\n" +
    "This short survey is part of a research study exploring how university students navigate life beyond their formal academic courses. " +
    "It focuses on areas such as time management, organization, personal development, wellbeing, finances, relationships, student engagement and preparation for the future.\n" +
    "The study aims to understand students' experiences, challenges and existing sources of support, and to assess whether there is a need for more structured guidance in these areas.\n" +
    "There are no right or wrong answers. We are interested in your genuine experience."
  );
  
  form.setAllowResponseEdits(false);
  form.setCollectEmail(false);
  
  // ----------------------------------------------------------------------------
  // SECTION 1 — PARTICIPANT PROFILE
  // ----------------------------------------------------------------------------
  var sec1 = form.addPageBreakItem();
  sec1.setTitle("SECTION 1 — PARTICIPANT PROFILE");
  
  // Q1 Name
  form.addTextItem().setTitle("1. Name (Optional)");
  
  // Q2 Gender
  form.addMultipleChoiceItem()
    .setTitle("2. Gender")
    .setChoiceValues(["Female", "Male", "Prefer not to say"])
    .showOtherOption(true)
    .setRequired(true);
    
  // Q3 Level of Study
  form.addMultipleChoiceItem()
    .setTitle("3. Current Level of Study")
    .setChoiceValues(["First Year", "Second Year", "Third Year", "Fourth Year"])
    .setRequired(true);
    
  // Q4 Type of Institution
  form.addMultipleChoiceItem()
    .setTitle("4. Type of Institution")
    .setChoiceValues(["Public university", "Private university"])
    .setRequired(true);
    
  // Q5 Programme
  form.addTextItem().setTitle("5. Programme/Field of Study (Optional)");
  
  // Q6 Age Group
  form.addMultipleChoiceItem()
    .setTitle("6. Age Group (Optional)")
    .setChoiceValues(["17-19", "20-22", "23-25", "26+"])
    .showOtherOption(true);
    
  // ----------------------------------------------------------------------------
  // SECTION 2 — UNIVERSITY LIFE EXPERIENCE
  // ----------------------------------------------------------------------------
  var sec2 = form.addPageBreakItem();
  sec2.setTitle("SECTION 2 — UNIVERSITY LIFE EXPERIENCE");
  
  form.addCheckboxItem()
    .setTitle("Question 1: Beyond attending classes, completing assignments and taking examinations, which areas of university life do you currently have to manage? (Select all that apply)")
    .setChoiceValues([
      "Time management",
      "Academic organization",
      "Financial management",
      "Family and household responsibilities",
      "Mental and emotional wellbeing",
      "Personal growth and self-management",
      "Social relationships",
      "Extracurricular involvement",
      "Leadership and collaboration",
      "Career preparation"
    ])
    .showOtherOption(true)
    .setRequired(true);
    
  form.addMultipleChoiceItem()
    .setTitle("Question 2: Overall, how prepared do you feel to manage the different demands of university life beyond your academic coursework?")
    .setChoiceValues(["Very well prepared", "Moderately prepared", "Not at all prepared"])
    .setRequired(true);
    
  form.addCheckboxItem()
    .setTitle("Question 3: How did you learn most of the skills you currently use to manage university life? (Select up to 3)")
    .setChoiceValues([
      "University programmes or services",
      "Family & Friends",
      "Student associations or clubs",
      "Mentors or role models",
      "Workshops or training",
      "Social media or online resources",
      "Personal experience"
    ])
    .setRequired(true);
    
  // ----------------------------------------------------------------------------
  // SECTION 3 — TIME MANAGEMENT & ORGANIZATION
  // ----------------------------------------------------------------------------
  var sec3 = form.addPageBreakItem();
  sec3.setTitle("SECTION 3 — TIME MANAGEMENT & ORGANIZATION");
  
  form.addMultipleChoiceItem()
    .setTitle("Question 4: How would you describe the way you currently manage your time and responsibilities at university?")
    .setChoiceValues([
      "I have a clear system and manage them well",
      "I have a system but sometimes struggle to follow it",
      "I manage things as they come",
      "I often struggle to balance my responsibilities",
      "I don't have a particular system"
    ])
    .setRequired(true);
    
  form.addCheckboxItem()
    .setTitle("Question 5: Which areas do you find most difficult to balance alongside your academic work? (Select up to 3)")
    .setChoiceValues([
      "Personal study and assignments",
      "Paid work or running a business",
      "Family duties and household tasks",
      "Friendships and relationships",
      "Student clubs and extracurricular activities",
      "Rest and personal time",
      "Exercise and physical health"
    ])
    .showOtherOption(true)
    .setRequired(true);
    
  form.addMultipleChoiceItem()
    .setTitle("Question 6: Have you received any structured guidance or training from your university on time management, planning or organizing your responsibilities?")
    .setChoiceValues(["Yes", "No"])
    .setRequired(true);
    
  // ----------------------------------------------------------------------------
  // SECTION 4 — PERSONAL DEVELOPMENT & SELF-MANAGEMENT
  // ----------------------------------------------------------------------------
  var sec4 = form.addPageBreakItem();
  sec4.setTitle("SECTION 4 — PERSONAL DEVELOPMENT & SELF-MANAGEMENT");
  
  form.addCheckboxItem()
    .setTitle("Question 7: Which personal development areas do you feel are important for your success at university and beyond? (Select up to 4)")
    .setChoiceValues([
      "Goal setting and planning",
      "Self-confidence and self-awareness",
      "Decision-making",
      "Communication skills",
      "Leadership",
      "Building healthy habits and discipline",
      "Problem-solving",
      "Independence and taking responsibility",
      "Identifying my strengths, interests and abilities"
    ])
    .showOtherOption(true)
    .setRequired(true);
    
  form.addMultipleChoiceItem()
    .setTitle("Question 8: How much guidance or opportunity have you received through your university to develop these skills?")
    .setChoiceValues(["A lot", "Some", "Very little", "None", "I'm not sure"])
    .setRequired(true);
    
  form.addCheckboxItem()
    .setTitle("Question 9: Which of these personal development areas would you most like more structured guidance on? (Select up to 3)")
    .setChoiceValues([
      "Goal setting and planning",
      "Confidence and self-awareness",
      "Decision-making",
      "Communication",
      "Leadership",
      "Discipline and healthy habits",
      "Problem-solving",
      "Independence",
      "Identifying my strengths and career interests"
    ])
    .showOtherOption(true)
    .setRequired(true);
    
  // ----------------------------------------------------------------------------
  // SECTION 5 — WELLBEING & MANAGING UNIVERSITY PRESSURE
  // ----------------------------------------------------------------------------
  var sec5 = form.addPageBreakItem();
  sec5.setTitle("SECTION 5 — WELLBEING & MANAGING UNIVERSITY PRESSURE");
  
  form.addCheckboxItem()
    .setTitle("Question 10: When you experience stress or feel overwhelmed by university responsibilities, what do you usually do? (Select up to 3)")
    .setChoiceValues([
      "Talk to family or friends",
      "Seek the university counselling department",
      "Take time to rest or disconnect",
      "Exercise or engage in other activities",
      "Pray or engage in spiritual activities",
      "Try to solve the problem myself",
      "Ignore it and continue with my responsibilities",
      "I am not sure what to do"
    ])
    .showOtherOption(true)
    .setRequired(true);
    
  form.addMultipleChoiceItem()
    .setTitle("Question 11: How much guidance or support does your university provide on managing stress, maintaining wellbeing and achieving balance in university life?")
    .setChoiceValues(["A lot", "Very little", "None", "I'm not sure"])
    .setRequired(true);
    
  // ----------------------------------------------------------------------------
  // SECTION 6 — FINANCIAL MANAGEMENT
  // ----------------------------------------------------------------------------
  var sec6 = form.addPageBreakItem();
  sec6.setTitle("SECTION 6 — FINANCIAL MANAGEMENT");
  
  form.addCheckboxItem()
    .setTitle("Question 12: Which aspects of managing money are most challenging for you as a university student? (Select up to 3)")
    .setChoiceValues([
      "Creating and following a budget",
      "Managing daily expenses",
      "Saving money",
      "Managing unexpected expenses",
      "Balancing needs and wants",
      "Managing financial support/allowance",
      "Paying for academic needs",
      "Managing transport and food expenses",
      "I don't currently experience significant difficulty"
    ])
    .showOtherOption(true)
    .setRequired(true);
    
  form.addCheckboxItem()
    .setTitle("Question 13: Where have you learned most of what you know about managing money? (Select up to 2)")
    .setChoiceValues([
      "Family",
      "University",
      "Friends/peers",
      "Personal experience",
      "Social media/internet",
      "Workshops or training",
      "Books/courses",
      "I have mostly had to figure it out myself",
      "I have not received any guidance"
    ])
    .showOtherOption(true)
    .setRequired(true);
    
  form.addMultipleChoiceItem()
    .setTitle("Question 14: How useful would structured guidance on financial management be to you as a university student?")
    .setChoiceValues(["Very useful", "Slightly useful", "Not sure", "Not useful at all"])
    .setRequired(true);
    
  // ----------------------------------------------------------------------------
  // SECTION 7 — RELATIONSHIPS, SOCIAL LIFE & STUDENT ENGAGEMENT
  // ----------------------------------------------------------------------------
  var sec7 = form.addPageBreakItem();
  sec7.setTitle("SECTION 7 — RELATIONSHIPS, SOCIAL LIFE & STUDENT ENGAGEMENT");
  
  form.addCheckboxItem()
    .setTitle("Question 15: Which aspects of social and student life are you currently involved in or have to manage? (Select all that apply)")
    .setChoiceValues([
      "Friendships and peer relationships",
      "Family relationships/responsibilities",
      "Student organizations or clubs",
      "Volunteering/community activities",
      "Leadership roles",
      "Religious or faith-based activities",
      "Sports or recreational activities",
      "Work/business alongside university",
      "Social activities",
      "I am not currently involved in activities outside my coursework"
    ])
    .showOtherOption(true)
    .setRequired(true);
    
  form.addMultipleChoiceItem()
    .setTitle("Question 16: How much guidance or support have you received from your university on getting involved in student activities, developing leadership/teamwork skills, or balancing these activities with your studies?")
    .setChoiceValues(["A lot", "Very little", "None", "I'm not sure"])
    .setRequired(true);
    
  form.addCheckboxItem()
    .setTitle("Question 17: Which areas would you find useful to receive more structured guidance on? (Select up to 3)")
    .setChoiceValues([
      "Building healthy relationships",
      "Communication",
      "Handling conflict",
      "Leadership",
      "Teamwork",
      "Finding and using student opportunities",
      "Getting involved in organizations/community activities",
      "Balancing activities with academic responsibilities",
      "Building a sense of belonging/community",
      "None"
    ])
    .showOtherOption(true)
    .setRequired(true);
    
  // ----------------------------------------------------------------------------
  // SECTION 8 — CAREER & FUTURE PREPARATION
  // ----------------------------------------------------------------------------
  var sec8 = form.addPageBreakItem();
  sec8.setTitle("SECTION 8 — CAREER & FUTURE PREPARATION");
  
  form.addMultipleChoiceItem()
    .setTitle("Question 18: How prepared do you currently feel for life after university?")
    .setChoiceValues(["Very prepared", "Somewhat prepared", "Not prepared at all"])
    .setRequired(true);
    
  form.addCheckboxItem()
    .setTitle("Question 19: Which areas of career and future preparation would you find most useful to receive guidance on? (Select up to 4)")
    .setChoiceValues([
      "Identifying career interests and direction",
      "CV/resume and application writing",
      "Job searching and employment opportunities",
      "Interview skills",
      "Networking and professional relationships",
      "Internships and work experience",
      "Professional communication and workplace skills",
      "Entrepreneurship/self-employment",
      "Further study and scholarships",
      "Building a professional profile/online presence",
      "Financial preparation for working life"
    ])
    .showOtherOption(true)
    .setRequired(true);
    
  form.addMultipleChoiceItem()
    .setTitle("Question 20: How much guidance or support does your university currently provide to help students prepare for their careers and life after graduation?")
    .setChoiceValues(["A lot", "Very little", "None", "I'm not sure"])
    .setRequired(true);
    
  form.addCheckboxItem()
    .setTitle("Question 21: Where do you currently get most of your career or future-related guidance? (Select up to 3)")
    .setChoiceValues([
      "University/lecturers",
      "Career services",
      "Family",
      "Friends/peers",
      "Mentors",
      "Professional networks",
      "Social media/internet",
      "Personal experience",
      "I mostly figure it out myself",
      "I currently don't receive much guidance"
    ])
    .showOtherOption(true)
    .setRequired(true);
    
  // ----------------------------------------------------------------------------
  // SECTION 9 — PERCEIVED GAPS & NEED FOR STRUCTURED SUPPORT
  // ----------------------------------------------------------------------------
  var sec9 = form.addPageBreakItem();
  sec9.setTitle("SECTION 9 — PERCEIVED GAPS & NEED FOR STRUCTURED SUPPORT");
  
  form.addMultipleChoiceItem()
    .setTitle("Question 22: Overall, how adequately do you feel your university prepares you to manage the different aspects of university life beyond your academic courses?")
    .setChoiceValues(["Very adequately", "Inadequately", "I'm not sure"])
    .setRequired(true);
    
  form.addCheckboxItem()
    .setTitle("Question 23: Which areas of university life do you feel students need more structured guidance or preparation in? (Select up to 5)")
    .setChoiceValues([
      "Time management & organization",
      "Personal development",
      "Wellbeing & managing stress",
      "Financial management",
      "Relationships & communication",
      "Student organizations & leadership",
      "Career & professional preparation",
      "Preparing for life after graduation",
      "Decision-making & independence"
    ])
    .showOtherOption(true)
    .setRequired(true);
    
  // Central Question
  form.addMultipleChoiceItem()
    .setTitle("Question 24: If your university offered a structured “University Life Management Foundation Course” to help students develop practical skills for navigating university life beyond their academic subjects, how useful do you think it would be?")
    .setChoiceValues(["Very useful", "Somewhat useful", "Not useful at all", "I'm not sure"])
    .setRequired(true);
    
  form.addCheckboxItem()
    .setTitle("Question 25: What format would you prefer for learning these skills? (Select up to 2)")
    .setChoiceValues([
      "A course integrated into the university curriculum",
      "Short workshops",
      "Orientation programme",
      "Mentorship programme",
      "Peer-support programme",
      "Practical projects/activities",
      "One-to-one guidance"
    ])
    .showOtherOption(true)
    .setRequired(true);
    
  form.addParagraphTextItem()
    .setTitle("Question 26: What is one thing you wish someone had taught or guided you on before or during your university experience?")
    .setRequired(false);
    
  form.addParagraphTextItem()
    .setTitle("Question 27: Is there anything else you believe universities could do to better prepare students for university life and life after graduation?")
    .setRequired(false);
    
  Logger.log("=================================================================");
  Logger.log("SUCCESS! Your University Life Management Survey has been created.");
  Logger.log("Edit URL: " + form.getEditUrl());
  Logger.log("Published Live URL: " + form.getPublishedUrl());
  Logger.log("=================================================================");
}
