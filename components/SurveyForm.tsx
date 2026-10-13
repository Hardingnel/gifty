'use client';

import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, ChevronLeft, Send, Sparkles } from 'lucide-react';
import { SurveyRecord } from '../lib/survey-parser';

interface SurveyFormProps {
  onSurveySubmitted: (record: SurveyRecord) => void;
}

export default function SurveyForm({ onSurveySubmitted }: SurveyFormProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Female',
    study_level: 'First Year',
    institution_type: 'Public university',
    programme: '',
    age_group: '20-22',
    q1_areas_managed: [] as string[],
    q2_preparedness: 'Moderately prepared',
    q3_skills_source: [] as string[],
    q4_time_system: 'I have a system but sometimes struggle to follow it',
    q5_difficult_balance: [] as string[],
    q6_time_guidance: 'No',
    q7_personal_dev_important: [] as string[],
    q8_personal_dev_received: 'Very little',
    q9_personal_dev_desired: [] as string[],
    q10_stress_coping: [] as string[],
    q11_wellbeing_received: 'Very little',
    q12_finance_challenges: [] as string[],
    q13_finance_source: [] as string[],
    q14_finance_utility: 'Very useful',
    q15_social_involvement: [] as string[],
    q16_social_guidance_received: 'Very little',
    q17_social_guidance_desired: [] as string[],
    q18_postgrad_preparedness: 'Somewhat prepared',
    q19_career_guidance_desired: [] as string[],
    q20_career_guidance_received: 'Very little',
    q21_career_source: [] as string[],
    q22_overall_adequacy: 'Inadequately',
    q23_areas_needing_guidance: [] as string[],
    q24_course_utility: 'Very useful',
    q25_preferred_format: [] as string[],
    q26_wish_taught: '',
    q27_general_recommendations: ''
  });

  const toggleCheckbox = (field: keyof typeof formData, item: string) => {
    const current = (formData[field] as string[]) || [];
    if (current.includes(item)) {
      setFormData({ ...formData, [field]: current.filter(i => i !== item) });
    } else {
      setFormData({ ...formData, [field]: [...current, item] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newRecord: SurveyRecord = {
      Response_ID: `RESP-${Date.now().toString().slice(-4)}`,
      Timestamp: new Date().toISOString(),
      Name: formData.name || 'Anonymous',
      Gender: formData.gender,
      Level_of_Study: formData.study_level,
      Institution_Type: formData.institution_type,
      Programme: formData.programme || 'General Studies',
      Age_Group: formData.age_group,
      q1_areas_managed: formData.q1_areas_managed.join(', '),
      q2_preparedness: formData.q2_preparedness,
      q3_skills_source: formData.q3_skills_source.join(', '),
      q4_time_system: formData.q4_time_system,
      q5_difficult_balance: formData.q5_difficult_balance.join(', '),
      q6_time_guidance: formData.q6_time_guidance,
      q7_personal_dev_important: formData.q7_personal_dev_important.join(', '),
      q8_personal_dev_received: formData.q8_personal_dev_received,
      q9_personal_dev_desired: formData.q9_personal_dev_desired.join(', '),
      q10_stress_coping: formData.q10_stress_coping.join(', '),
      q11_wellbeing_received: formData.q11_wellbeing_received,
      q12_finance_challenges: formData.q12_finance_challenges.join(', '),
      q13_finance_source: formData.q13_finance_source.join(', '),
      q14_finance_utility: formData.q14_finance_utility,
      q15_social_involvement: formData.q15_social_involvement.join(', '),
      q16_social_guidance_received: formData.q16_social_guidance_received,
      q17_social_guidance_desired: formData.q17_social_guidance_desired.join(', '),
      q18_postgrad_preparedness: formData.q18_postgrad_preparedness,
      q19_career_guidance_desired: formData.q19_career_guidance_desired.join(', '),
      q20_career_guidance_received: formData.q20_career_guidance_received,
      q21_career_source: formData.q21_career_source.join(', '),
      q22_overall_adequacy: formData.q22_overall_adequacy,
      q23_areas_needing_guidance: formData.q23_areas_needing_guidance.join(', '),
      q24_course_utility: formData.q24_course_utility,
      q25_preferred_format: formData.q25_preferred_format.join(', '),
      q26_wish_taught: formData.q26_wish_taught,
      q27_general_recommendations: formData.q27_general_recommendations
    };

    try {
      const webhookUrl = typeof window !== 'undefined' ? localStorage.getItem('google_sheet_webhook_url') : '';
      const payload = webhookUrl ? { ...newRecord, _sheetWebhookUrl: webhookUrl } : newRecord;

      await fetch('/api/submit-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn('API submission failed:', err);
    }

    onSurveySubmitted(newRecord);
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center max-w-xl mx-auto shadow-md">
        <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Thank You for Participating!</h2>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          Your survey response has been successfully submitted and incorporated into the research dataset. You can now view how your answers reflect in the live Research Dashboard.
        </p>
        <button
          onClick={() => {
            setIsSuccess(false);
            setCurrentStep(1);
          }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm transition"
        >
          Submit Another Response
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto overflow-hidden">
      {/* HEADER & STEPPER */}
      <div className="bg-slate-900 text-white p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
            Section {currentStep} of 9
          </span>
          <span className="text-xs text-slate-400">Estimated: 5 Minutes</span>
        </div>
        <h2 className="text-lg font-bold">
          {currentStep === 1 && 'Section 1: Participant Profile'}
          {currentStep === 2 && 'Section 2: University Life Experience'}
          {currentStep === 3 && 'Section 3: Time Management & Organization'}
          {currentStep === 4 && 'Section 4: Personal Development & Self-Management'}
          {currentStep === 5 && 'Section 5: Wellbeing & Managing Stress'}
          {currentStep === 6 && 'Section 6: Financial Management'}
          {currentStep === 7 && 'Section 7: Relationships & Student Engagement'}
          {currentStep === 8 && 'Section 8: Career & Future Preparation'}
          {currentStep === 9 && 'Section 9: Gaps & Foundation Course (Central Question)'}
        </h2>
        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${(currentStep / 9) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* SECTION 1 */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">1. Full Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. John Doe or leave blank"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">2. Gender *</label>
              <div className="grid grid-cols-2 gap-2">
                {['Female', 'Male', 'Prefer not to say', 'Other'].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: g })}
                    className={`p-2.5 text-xs text-left rounded-lg border font-medium transition ${formData.gender === g ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">3. Current Level of Study *</label>
              <div className="grid grid-cols-2 gap-2">
                {['First Year', 'Second Year', 'Third Year', 'Fourth Year'].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setFormData({ ...formData, study_level: lvl })}
                    className={`p-2.5 text-xs text-left rounded-lg border font-medium transition ${formData.study_level === lvl ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">4. Type of Institution *</label>
              <div className="grid grid-cols-2 gap-2">
                {['Public university', 'Private university'].map(inst => (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => setFormData({ ...formData, institution_type: inst })}
                    className={`p-2.5 text-xs text-left rounded-lg border font-medium transition ${formData.institution_type === inst ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    {inst}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">5. Programme / Field of Study (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Computer Science, Economics, Nursing..."
                value={formData.programme}
                onChange={e => setFormData({ ...formData, programme: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">6. Age Group</label>
              <div className="grid grid-cols-4 gap-2">
                {['17-19', '20-22', '23-25', '26+'].map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setFormData({ ...formData, age_group: a })}
                    className={`p-2 text-xs text-center rounded-lg border font-medium transition ${formData.age_group === a ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2 */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q1. Beyond attending classes, completing assignments and exams, which areas of university life do you currently have to manage? (Select all that apply)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Time management', 'Academic organization', 'Financial management',
                  'Family and household responsibilities', 'Mental and emotional wellbeing',
                  'Personal growth and self-management', 'Social relationships',
                  'Extracurricular involvement', 'Leadership and collaboration', 'Career preparation'
                ].map(area => {
                  const checked = formData.q1_areas_managed.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleCheckbox('q1_areas_managed', area)}
                      className={`p-2.5 text-xs text-left rounded-lg border transition flex items-center justify-between ${checked ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span>{area}</span>
                      {checked && <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q2. Overall, how prepared do you feel to manage the different demands of university life beyond your academic coursework? *
              </label>
              <div className="space-y-2">
                {['Very well prepared', 'Moderately prepared', 'Not at all prepared'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData({ ...formData, q2_preparedness: opt })}
                    className={`w-full p-2.5 text-xs text-left rounded-lg border transition ${formData.q2_preparedness === opt ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q3. How did you learn most of the skills you currently use to manage university life? (Select up to 3)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'University programmes or services', 'Family & Friends', 'Student associations or clubs',
                  'Mentors or role models', 'Workshops or training', 'Social media or online resources', 'Personal experience'
                ].map(source => {
                  const checked = formData.q3_skills_source.includes(source);
                  return (
                    <button
                      key={source}
                      type="button"
                      onClick={() => toggleCheckbox('q3_skills_source', source)}
                      className={`p-2.5 text-xs text-left rounded-lg border transition flex items-center justify-between ${checked ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span>{source}</span>
                      {checked && <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3 */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q4. How would you describe the way you currently manage your time and responsibilities at university? *
              </label>
              <div className="space-y-2">
                {[
                  'I have a clear system and manage them well',
                  'I have a system but sometimes struggle to follow it',
                  'I manage things as they come',
                  'I often struggle to balance my responsibilities',
                  "I don't have a particular system"
                ].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData({ ...formData, q4_time_system: opt })}
                    className={`w-full p-2.5 text-xs text-left rounded-lg border transition ${formData.q4_time_system === opt ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q5. Which areas do you find most difficult to balance alongside your academic work? (Select up to 3)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Personal study and assignments', 'Paid work or running a business',
                  'Family duties and household tasks', 'Friendships and relationships',
                  'Student clubs and extracurricular activities', 'Rest and personal time', 'Exercise and physical health'
                ].map(area => {
                  const checked = formData.q5_difficult_balance.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleCheckbox('q5_difficult_balance', area)}
                      className={`p-2.5 text-xs text-left rounded-lg border transition flex items-center justify-between ${checked ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span>{area}</span>
                      {checked && <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q6. Have you received any structured guidance or training from your university on time management, planning or organizing? *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['Yes', 'No'].map(ans => (
                  <button
                    key={ans}
                    type="button"
                    onClick={() => setFormData({ ...formData, q6_time_guidance: ans })}
                    className={`p-3 text-xs text-center rounded-lg border font-bold transition ${formData.q6_time_guidance === ans ? 'bg-blue-50 border-blue-500 text-blue-900' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    {ans}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4 */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q7. Which personal development areas do you feel are important for your success at university and beyond? (Select up to 4)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Goal setting and planning', 'Self-confidence and self-awareness', 'Decision-making',
                  'Communication skills', 'Leadership', 'Building healthy habits and discipline',
                  'Problem-solving', 'Independence and taking responsibility', 'Identifying my strengths, interests and abilities'
                ].map(item => {
                  const checked = formData.q7_personal_dev_important.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleCheckbox('q7_personal_dev_important', item)}
                      className={`p-2.5 text-xs text-left rounded-lg border transition flex items-center justify-between ${checked ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span>{item}</span>
                      {checked && <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q8. How much guidance or opportunity have you received through your university to develop these skills? *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['A lot', 'Some', 'Very little', 'None', "I'm not sure"].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData({ ...formData, q8_personal_dev_received: opt })}
                    className={`p-2.5 text-xs text-center rounded-lg border transition ${formData.q8_personal_dev_received === opt ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q9. Which of these personal development areas would you most like more structured guidance on? (Select up to 3)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Goal setting and planning', 'Confidence and self-awareness', 'Decision-making',
                  'Communication', 'Leadership', 'Discipline and healthy habits',
                  'Problem-solving', 'Independence', 'Identifying my strengths and career interests'
                ].map(item => {
                  const checked = formData.q9_personal_dev_desired.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleCheckbox('q9_personal_dev_desired', item)}
                      className={`p-2.5 text-xs text-left rounded-lg border transition flex items-center justify-between ${checked ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span>{item}</span>
                      {checked && <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5 */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q10. When you experience stress or feel overwhelmed by university responsibilities, what do you usually do? (Select up to 3)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Talk to family or friends', 'Seek the university counselling department',
                  'Take time to rest or disconnect', 'Exercise or engage in other activities',
                  'Pray or engage in spiritual activities', 'Try to solve the problem myself',
                  'Ignore it and continue with my responsibilities', 'I am not sure what to do'
                ].map(item => {
                  const checked = formData.q10_stress_coping.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleCheckbox('q10_stress_coping', item)}
                      className={`p-2.5 text-xs text-left rounded-lg border transition flex items-center justify-between ${checked ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span>{item}</span>
                      {checked && <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q11. How much guidance or support does your university provide on managing stress, maintaining wellbeing and achieving balance? *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['A lot', 'Very little', 'None', "I'm not sure"].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData({ ...formData, q11_wellbeing_received: opt })}
                    className={`p-2.5 text-xs text-center rounded-lg border transition ${formData.q11_wellbeing_received === opt ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6 */}
        {currentStep === 6 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q12. Which aspects of managing money are most challenging for you as a university student? (Select up to 3)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Creating and following a budget', 'Managing daily expenses', 'Saving money',
                  'Managing unexpected expenses', 'Balancing needs and wants', 'Managing financial support/allowance',
                  'Paying for academic needs', 'Managing transport and food expenses', 'I don\'t currently experience significant difficulty'
                ].map(item => {
                  const checked = formData.q12_finance_challenges.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleCheckbox('q12_finance_challenges', item)}
                      className={`p-2.5 text-xs text-left rounded-lg border transition flex items-center justify-between ${checked ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span>{item}</span>
                      {checked && <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q13. Where have you learned most of what you know about managing money? (Select up to 2)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Family', 'University', 'Friends/peers', 'Personal experience',
                  'Social media/internet', 'Workshops or training', 'Books/courses',
                  'I have mostly had to figure it out myself', 'I have not received any guidance'
                ].map(item => {
                  const checked = formData.q13_finance_source.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleCheckbox('q13_finance_source', item)}
                      className={`p-2.5 text-xs text-left rounded-lg border transition flex items-center justify-between ${checked ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span>{item}</span>
                      {checked && <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q14. How useful would structured guidance on financial management be to you as a university student? *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Very useful', 'Slightly useful', 'Not sure', 'Not useful at all'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData({ ...formData, q14_finance_utility: opt })}
                    className={`p-2.5 text-xs text-center rounded-lg border transition ${formData.q14_finance_utility === opt ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 7 */}
        {currentStep === 7 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q15. Which aspects of social and student life are you currently involved in or have to manage? (Select all that apply)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Friendships and peer relationships', 'Family relationships/responsibilities',
                  'Student organizations or clubs', 'Volunteering/community activities', 'Leadership roles',
                  'Religious or faith-based activities', 'Sports or recreational activities',
                  'Work/business alongside university', 'Social activities',
                  'I am not currently involved in activities outside my coursework'
                ].map(item => {
                  const checked = formData.q15_social_involvement.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleCheckbox('q15_social_involvement', item)}
                      className={`p-2.5 text-xs text-left rounded-lg border transition flex items-center justify-between ${checked ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span>{item}</span>
                      {checked && <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q16. How much guidance or support have you received from your university on getting involved in student activities, leadership, or balance? *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['A lot', 'Very little', 'None', "I'm not sure"].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData({ ...formData, q16_social_guidance_received: opt })}
                    className={`p-2.5 text-xs text-center rounded-lg border transition ${formData.q16_social_guidance_received === opt ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q17. Which areas would you find useful to receive more structured guidance on? (Select up to 3)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Building healthy relationships', 'Communication', 'Handling conflict',
                  'Leadership', 'Teamwork', 'Finding and using student opportunities',
                  'Getting involved in organizations/community activities',
                  'Balancing activities with academic responsibilities', 'Building a sense of belonging/community',
                  'None'
                ].map(item => {
                  const checked = formData.q17_social_guidance_desired.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleCheckbox('q17_social_guidance_desired', item)}
                      className={`p-2.5 text-xs text-left rounded-lg border transition flex items-center justify-between ${checked ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span>{item}</span>
                      {checked && <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 8 */}
        {currentStep === 8 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q18. How prepared do you currently feel for life after university? *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Very prepared', 'Somewhat prepared', 'Not prepared at all'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData({ ...formData, q18_postgrad_preparedness: opt })}
                    className={`p-2.5 text-xs text-center rounded-lg border transition ${formData.q18_postgrad_preparedness === opt ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q19. Which areas of career and future preparation would you find most useful to receive guidance on? (Select up to 4)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Identifying career interests and direction', 'CV/resume and application writing',
                  'Job searching and employment opportunities', 'Interview skills',
                  'Networking and professional relationships', 'Internships and work experience',
                  'Professional communication and workplace skills', 'Entrepreneurship/self-employment',
                  'Further study and scholarships', 'Building a professional profile/online presence',
                  'Financial preparation for working life'
                ].map(item => {
                  const checked = formData.q19_career_guidance_desired.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleCheckbox('q19_career_guidance_desired', item)}
                      className={`p-2.5 text-xs text-left rounded-lg border transition flex items-center justify-between ${checked ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span>{item}</span>
                      {checked && <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q20. How much guidance or support does your university currently provide to help students prepare for their careers and life after graduation? *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['A lot', 'Very little', 'None', "I'm not sure"].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData({ ...formData, q20_career_guidance_received: opt })}
                    className={`p-2.5 text-xs text-center rounded-lg border transition ${formData.q20_career_guidance_received === opt ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q21. Where do you currently get most of your career or future-related guidance? (Select up to 3)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'University/lecturers', 'Career services', 'Family', 'Friends/peers',
                  'Mentors', 'Professional networks', 'Social media/internet', 'Personal experience',
                  'I mostly figure it out myself', "I currently don't receive much guidance"
                ].map(item => {
                  const checked = formData.q21_career_source.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleCheckbox('q21_career_source', item)}
                      className={`p-2.5 text-xs text-left rounded-lg border transition flex items-center justify-between ${checked ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span>{item}</span>
                      {checked && <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 9 */}
        {currentStep === 9 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q22. Overall, how adequately do you feel your university prepares you to manage the different aspects of university life beyond your academic courses? *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Very adequately', 'Inadequately', "I'm not sure"].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData({ ...formData, q22_overall_adequacy: opt })}
                    className={`p-2.5 text-xs text-center rounded-lg border transition ${formData.q22_overall_adequacy === opt ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q23. Which areas of university life do you feel students need more structured guidance or preparation in? (Select up to 5)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Time management & organization', 'Personal development', 'Wellbeing & managing stress',
                  'Financial management', 'Relationships & communication', 'Student organizations & leadership',
                  'Career & professional preparation', 'Preparing for life after graduation', 'Decision-making & independence'
                ].map(item => {
                  const checked = formData.q23_areas_needing_guidance.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleCheckbox('q23_areas_needing_guidance', item)}
                      className={`p-2.5 text-xs text-left rounded-lg border transition flex items-center justify-between ${checked ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span>{item}</span>
                      {checked && <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Central Question */}
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <label className="block text-xs font-black text-emerald-900 mb-2">
                Q24. (The Central Question) If your university offered a structured “University Life Management Foundation Course” to help students develop practical skills for navigating university life beyond their academic subjects, how useful do you think it would be? *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Very useful', 'Somewhat useful', 'Not useful at all', "I'm not sure"].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData({ ...formData, q24_course_utility: opt })}
                    className={`p-2.5 text-xs text-center rounded-lg border font-bold transition ${formData.q24_course_utility === opt ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Q25. What format would you prefer for learning these skills? (Select up to 2)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'A course integrated into the university curriculum', 'Short workshops',
                  'Orientation programme', 'Mentorship programme', 'Peer-support programme',
                  'Practical projects/activities', 'One-to-one guidance'
                ].map(item => {
                  const checked = formData.q25_preferred_format.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleCheckbox('q25_preferred_format', item)}
                      className={`p-2.5 text-xs text-left rounded-lg border transition flex items-center justify-between ${checked ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span>{item}</span>
                      {checked && <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Q26. What is one thing you wish someone had taught or guided you on before or during your university experience?
              </label>
              <textarea
                rows={3}
                placeholder="Share your personal experience..."
                value={formData.q26_wish_taught}
                onChange={e => setFormData({ ...formData, q26_wish_taught: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Q27. Is there anything else you believe universities could do to better prepare students for university life and life after graduation?
              </label>
              <textarea
                rows={3}
                placeholder="Recommendations for universities..."
                value={formData.q27_general_recommendations}
                onChange={e => setFormData({ ...formData, q27_general_recommendations: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* BOTTOM STEP CONTROLS */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1.5"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </button>
          ) : <div />}

          {currentStep < 9 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              Next Section <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition flex items-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Survey'} <Send className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
