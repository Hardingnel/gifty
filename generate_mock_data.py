"""
Mock Data Generator for University Life Management Survey
Generates realistic university student responses strictly matching the 27 research questions.
"""

import random
from datetime import datetime, timedelta
import pandas as pd
import os

def generate_mock_university_survey(num_records=180, output_path="data/sample_raw_responses.csv"):
    random.seed(42)
    
    # Participant Profiles
    genders = ["Female", "Male", "Prefer not to say"]
    study_levels = ["First Year", "Second Year", "Third Year", "Fourth Year"]
    study_level_weights = [0.35, 0.28, 0.22, 0.15] # Typical distribution
    institution_types = ["Public university", "Private university"]
    institution_weights = [0.70, 0.30]
    programmes = [
        "Computer Science", "Business Administration", "Economics", "Law",
        "Mechanical Engineering", "Medicine & Health Sciences", "Mass Communication",
        "Psychology", "Nursing", "Accounting & Finance", "Biological Sciences", "Architecture"
    ]
    age_groups = ["17-19", "20-22", "23-25", "26+"]
    age_weights = [0.35, 0.45, 0.15, 0.05]
    
    # Q1 Areas managed
    q1_options = [
        "Time management", "Academic organization", "Financial management",
        "Family and household responsibilities", "Mental and emotional wellbeing",
        "Personal growth and self-management", "Social relationships",
        "Extracurricular involvement", "Leadership and collaboration", "Career preparation"
    ]
    
    # Q2 Preparedness
    q2_options = ["Very well prepared", "Moderately prepared", "Not at all prepared"]
    
    # Q3 Skill learning sources
    q3_options = [
        "University programmes or services", "Family & Friends", "Student associations or clubs",
        "Mentors or role models", "Workshops or training", "Social media or online resources", "Personal experience"
    ]
    
    # Q4 Time management system
    q4_options = [
        "I have a clear system and manage them well",
        "I have a system but sometimes struggle to follow it",
        "I manage things as they come",
        "I often struggle to balance my responsibilities",
        "I don't have a particular system"
    ]
    
    # Q5 Difficult areas to balance
    q5_options = [
        "Personal study and assignments", "Paid work or running a business",
        "Family duties and household tasks", "Friendships and relationships",
        "Student clubs and extracurricular activities", "Rest and personal time",
        "Exercise and physical health"
    ]
    
    # Q7 Personal development areas
    q7_options = [
        "Goal setting and planning", "Self-confidence and self-awareness", "Decision-making",
        "Communication skills", "Leadership", "Building healthy habits and discipline",
        "Problem-solving", "Independence and taking responsibility",
        "Identifying my strengths, interests and abilities"
    ]
    
    # Q8 University guidance level
    guidance_levels = ["A lot", "Some", "Very little", "None", "I'm not sure"]
    
    # Q9 Most desired personal dev areas
    q9_options = [
        "Goal setting and planning", "Confidence and self-awareness", "Decision-making",
        "Communication", "Leadership", "Discipline and healthy habits",
        "Problem-solving", "Independence", "Identifying my strengths and career interests"
    ]
    
    # Q10 Coping mechanisms
    q10_options = [
        "Talk to family or friends", "Seek the university counselling department",
        "Take time to rest or disconnect", "Exercise or engage in other activities",
        "Pray or engage in spiritual activities", "Try to solve the problem myself",
        "Ignore it and continue with my responsibilities", "I am not sure what to do"
    ]
    
    # Q12 Financial challenges
    q12_options = [
        "Creating and following a budget", "Managing daily expenses", "Saving money",
        "Managing unexpected expenses", "Balancing needs and wants", "Managing financial support/allowance",
        "Paying for academic needs", "Managing transport and food expenses", "I don't currently experience significant difficulty"
    ]
    
    # Q13 Money guidance sources
    q13_options = [
        "Family", "University", "Friends/peers", "Personal experience",
        "Social media/internet", "Workshops or training", "Books/courses",
        "I have mostly had to figure it out myself", "I have not received any guidance"
    ]
    
    # Q15 Social and student life involved
    q15_options = [
        "Friendships and peer relationships", "Family relationships/responsibilities",
        "Student organizations or clubs", "Volunteering/community activities", "Leadership roles",
        "Religious or faith-based activities", "Sports or recreational activities",
        "Work/business alongside university", "Social activities"
    ]
    
    # Q17 Useful areas for structured guidance
    q17_options = [
        "Building healthy relationships", "Communication", "Handling conflict",
        "Leadership", "Teamwork", "Finding and using student opportunities",
        "Getting involved in organizations/community activities",
        "Balancing activities with academic responsibilities", "Building a sense of belonging/community"
    ]
    
    # Q19 Career guidance areas
    q19_options = [
        "Identifying career interests and direction", "CV/resume and application writing",
        "Job searching and employment opportunities", "Interview skills",
        "Networking and professional relationships", "Internships and work experience",
        "Professional communication and workplace skills", "Entrepreneurship/self-employment",
        "Further study and scholarships", "Building a professional profile/online presence",
        "Financial preparation for working life"
    ]
    
    # Q21 Career guidance sources
    q21_options = [
        "University/lecturers", "Career services", "Family", "Friends/peers",
        "Mentors", "Professional networks", "Social media/internet",
        "Personal experience", "I mostly figure it out myself", "I currently don't receive much guidance"
    ]
    
    # Q23 Areas students need more structured guidance in
    q23_options = [
        "Time management & organization", "Personal development", "Wellbeing & managing stress",
        "Financial management", "Relationships & communication", "Student organizations & leadership",
        "Career & professional preparation", "Preparing for life after graduation", "Decision-making & independence"
    ]
    
    # Q25 Preferred format
    q25_options = [
        "A course integrated into the university curriculum", "Short workshops",
        "Orientation programme", "Mentorship programme", "Peer-support programme",
        "Practical projects/activities", "One-to-one guidance"
    ]
    
    # Q26 Open-ended quotes pool
    q26_pool = [
        "How to manage finances and live within a budget without going broke mid-semester.",
        "Emotional resilience and how to avoid severe burnout when coursework piles up.",
        "How to build professional networks and land internships while still in school.",
        "Effective study strategies, time blocking, and saying no to unnecessary commitments.",
        "Practical career skills and CV writing instead of only theoretical lectures.",
        "Managing independence, cooking, health, and personal discipline away from home.",
        "Mental health awareness and knowing that it is okay to ask for help.",
        "Handling relationship conflicts and setting boundaries with peers.",
        "Understanding tax, savings, investing, and the realities of life after graduation.",
        "Navigating imposter syndrome and building genuine self-confidence."
    ]
    
    q27_pool = [
        "Make life management workshops mandatory for all incoming first-year students.",
        "Create more dedicated spaces for mental health support and destigmatize counselling.",
        "Host regular career preparation bootcamps with industry professionals.",
        "Introduce a credit-bearing foundation course on practical adulthood and life skills.",
        "Provide accessible emergency financial guidance and student budgeting tools.",
        "Foster stronger peer mentorship connections between senior and junior students.",
        "Ensure lecturers are trained to recognize signs of acute student overwhelm.",
        "Offer flexible learning schedules and mental health recovery days."
    ]
    
    start_date = datetime.now() - timedelta(days=60)
    records = []
    
    for i in range(num_records):
        rand_offset = random.uniform(0, 60)
        timestamp = start_date + timedelta(days=rand_offset, hours=random.randint(8, 22), minutes=random.randint(0, 59))
        
        level = random.choices(study_levels, weights=study_level_weights)[0]
        gender = random.choices(genders, weights=[0.52, 0.44, 0.04])[0]
        inst_type = random.choices(institution_types, weights=institution_weights)[0]
        prog = random.choice(programmes)
        age = random.choices(age_groups, weights=age_weights)[0]
        name = f"Student {1000 + i}" if random.random() < 0.6 else ""
        
        # Q1: 3 to 6 areas
        q1_selected = random.sample(q1_options, k=random.randint(3, 6))
        
        # Q2: Preparedness (First & second years often feel less prepared)
        if level in ["First Year", "Second Year"]:
            q2 = random.choices(q2_options, weights=[0.15, 0.55, 0.30])[0]
        else:
            q2 = random.choices(q2_options, weights=[0.25, 0.55, 0.20])[0]
            
        # Q3: Sources of learning (up to 3)
        q3_selected = random.sample(q3_options, k=random.randint(1, 3))
        
        # Q4: Time system
        q4 = random.choices(q4_options, weights=[0.18, 0.38, 0.22, 0.16, 0.06])[0]
        
        # Q5: Difficult areas (up to 3)
        q5_selected = random.sample(q5_options, k=random.randint(1, 3))
        
        # Q6: Received structured guidance on time management
        q6 = random.choices(["Yes", "No"], weights=[0.24, 0.76])[0]
        
        # Q7: Personal dev areas (up to 4)
        q7_selected = random.sample(q7_options, k=random.randint(2, 4))
        
        # Q8: University guidance on personal dev
        q8 = random.choices(guidance_levels, weights=[0.10, 0.30, 0.38, 0.16, 0.06])[0]
        
        # Q9: Desired personal dev areas (up to 3)
        q9_selected = random.sample(q9_options, k=random.randint(1, 3))
        
        # Q10: Coping mechanisms (up to 3)
        q10_selected = random.sample(q10_options, k=random.randint(1, 3))
        
        # Q11: University wellbeing guidance
        q11 = random.choices(["A lot", "Very little", "None", "I'm not sure"], weights=[0.12, 0.44, 0.32, 0.12])[0]
        
        # Q12: Financial challenges (up to 3)
        q12_selected = random.sample(q12_options, k=random.randint(1, 3))
        
        # Q13: Financial guidance source (up to 2)
        q13_selected = random.sample(q13_options, k=random.randint(1, 2))
        
        # Q14: Financial guidance utility
        q14 = random.choices(["Very useful", "Slightly useful", "Not sure", "Not useful at all"], weights=[0.72, 0.18, 0.07, 0.03])[0]
        
        # Q15: Social life involvement
        q15_selected = random.sample(q15_options, k=random.randint(2, 5))
        
        # Q16: University guidance on student activities
        q16 = random.choices(["A lot", "Very little", "None", "I'm not sure"], weights=[0.16, 0.45, 0.27, 0.12])[0]
        
        # Q17: Structured guidance desired on social life (up to 3)
        q17_selected = random.sample(q17_options, k=random.randint(1, 3))
        
        # Q18: Preparedness for life after university
        # Final year students frequently report acute anxiety/unpreparedness
        if level in ["Third Year", "Fourth Year"]:
            q18 = random.choices(["Very prepared", "Somewhat prepared", "Not prepared at all"], weights=[0.14, 0.52, 0.34])[0]
        else:
            q18 = random.choices(["Very prepared", "Somewhat prepared", "Not prepared at all"], weights=[0.18, 0.54, 0.28])[0]
            
        # Q19: Career guidance areas (up to 4)
        q19_selected = random.sample(q19_options, k=random.randint(2, 4))
        
        # Q20: University career guidance
        q20 = random.choices(["A lot", "Very little", "None", "I'm not sure"], weights=[0.18, 0.42, 0.28, 0.12])[0]
        
        # Q21: Career guidance sources (up to 3)
        q21_selected = random.sample(q21_options, k=random.randint(1, 3))
        
        # Q22: Overall university preparation adequacy
        q22 = random.choices(["Very adequately", "Inadequately", "I'm not sure"], weights=[0.16, 0.65, 0.19])[0]
        
        # Q23: Areas needing more structured preparation (up to 5)
        q23_selected = random.sample(q23_options, k=random.randint(3, 5))
        
        # Q24: Central Question - Foundation Course Utility
        q24 = random.choices(["Very useful", "Somewhat useful", "Not useful at all", "I'm not sure"], weights=[0.78, 0.17, 0.02, 0.03])[0]
        
        # Q25: Preferred format (up to 2)
        q25_selected = random.sample(q25_options, k=random.randint(1, 2))
        
        # Q26 & Q27: Qualitative
        q26 = random.choice(q26_pool) if random.random() < 0.85 else ""
        q27 = random.choice(q27_pool) if random.random() < 0.65 else ""
        
        record = {
            "Timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "1. Name (Optional)": name,
            "2. Gender": gender,
            "3. Current Level of Study": level,
            "4. Type of Institution": inst_type,
            "5. Programme/Field of Study (Optional)": prog,
            "6. Age Group (Optional)": age,
            "Q1. Beyond attending classes, which areas of university life do you currently have to manage?": ", ".join(q1_selected),
            "Q2. Overall, how prepared do you feel to manage the different demands of university life beyond your academic coursework?": q2,
            "Q3. How did you learn most of the skills you currently use to manage university life?": ", ".join(q3_selected),
            "Q4. How would you describe the way you currently manage your time and responsibilities at university?": q4,
            "Q5. Which areas do you find most difficult to balance alongside your academic work?": ", ".join(q5_selected),
            "Q6. Have you received any structured guidance or training from your university on time management, planning or organizing your responsibilities?": q6,
            "Q7. Which personal development areas do you feel are important for your success at university and beyond?": ", ".join(q7_selected),
            "Q8. How much guidance or opportunity have you received through your university to develop these skills?": q8,
            "Q9. Which of these personal development areas would you most like more structured guidance on?": ", ".join(q9_selected),
            "Q10. When you experience stress or feel overwhelmed by university responsibilities, what do you usually do?": ", ".join(q10_selected),
            "Q11. How much guidance or support does your university provide on managing stress, maintaining wellbeing and achieving balance in university life?": q11,
            "Q12. Which aspects of managing money are most challenging for you as a university student?": ", ".join(q12_selected),
            "Q13. Where have you learned most of what you know about managing money?": ", ".join(q13_selected),
            "Q14. How useful would structured guidance on financial management be to you as a university student?": q14,
            "Q15. Which aspects of social and student life are you currently involved in or have to manage?": ", ".join(q15_selected),
            "Q16. How much guidance or support have you received from your university on getting involved in student activities, developing leadership/teamwork skills, or balancing these activities with your studies?": q16,
            "Q17. Which areas would you find useful to receive more structured guidance on?": ", ".join(q17_selected),
            "Q18. How prepared do you currently feel for life after university?": q18,
            "Q19. Which areas of career and future preparation would you find most useful to receive guidance on?": ", ".join(q19_selected),
            "Q20. How much guidance or support does your university currently provide to help students prepare for their careers and life after graduation?": q20,
            "Q21. Where do you currently get most of your career or future-related guidance?": ", ".join(q21_selected),
            "Q22. Overall, how adequately do you feel your university prepares you to manage the different aspects of university life beyond your academic courses?": q22,
            "Q23. Which areas of university life do you feel students need more structured guidance or preparation in?": ", ".join(q23_selected),
            "Q24. If your university offered a structured \"University Life Management Foundation Course\", how useful do you think it would be?": q24,
            "Q25. What format would you prefer for learning these skills?": ", ".join(q25_selected),
            "Q26. What is one thing you wish someone had taught or guided you on before or during your university experience?": q26,
            "Q27. Is there anything else you believe universities could do to better prepare students for university life and life after graduation?": q27
        }
        records.append(record)
        
    df = pd.DataFrame(records)
    df = df.sort_values(by="Timestamp").reset_index(drop=True)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} authentic university student survey responses saved to: {output_path}")
    return df

if __name__ == "__main__":
    generate_mock_university_survey()
