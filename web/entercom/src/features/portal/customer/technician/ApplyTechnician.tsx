import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../../../shared/components/ui/toastStore';
import { apiClient } from '../../../../api/axios';

export default function ApplyTechnician() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await apiClient.post('/users/technician-applications/', payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Your application has been submitted successfully.');
      queryClient.invalidateQueries({ queryKey: ['technician-application'] });
      navigate('/portal/customer');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit application. You may have already applied.');
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data: Record<string, any> = {};
    
    for (const [key, value] of form.entries()) {
      if (data[key]) {
        if (!Array.isArray(data[key])) {
          data[key] = [data[key]];
        }
        data[key].push(value);
      } else {
        data[key] = value;
      }
    }
    
    const skills = form.getAll('skills') as string[];
    const documents = form.getAll('documents') as string[];
    
    submitMutation.mutate({
      skills: skills,
      document_urls: documents,
      form_data: data,
    });
  };

  const { data: applications, isLoading } = useQuery({
    queryKey: ['technician-application'],
    queryFn: async () => {
      const response = await apiClient.get('/users/technician-applications/');
      return response.data;
    }
  });

  const isPending = submitMutation.isPending;

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  const existingApplication = applications && applications.length > 0 ? applications[0] : null;

  if (existingApplication) {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Application Status</h2>
        
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Technician Application</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              existingApplication.status === 'approved' ? 'bg-green-100 text-green-800' :
              existingApplication.status === 'rejected' ? 'bg-red-100 text-red-800' :
              existingApplication.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
              existingApplication.status === 'more_info_requested' ? 'bg-orange-100 text-orange-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {existingApplication.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          
          <p className="text-gray-600 mb-2">
            Submitted on: {new Date(existingApplication.created_at).toLocaleDateString()}
          </p>

          {existingApplication.status === 'rejected' && existingApplication.rejection_reason && (
            <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-md">
              <strong>Reason:</strong> {existingApplication.rejection_reason}
            </div>
          )}

          {existingApplication.status === 'more_info_requested' && (
            <div className="mt-4 p-4 bg-orange-50 text-orange-800 rounded-md">
              The reviewer has requested more information. Please wait for them to reach out to you or contact support.
            </div>
          )}
          
          <div className="mt-6 text-sm text-gray-500">
            You cannot submit a new application while one is already active.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
<style>{`
    :root {
      --navy: #081f3d;
      --blue: #0f4c81;
      --orange: #f7941d;
      --green: #25d366;
      --light: #f4f7fb;
      --white: #ffffff;
      --text: #1f2937;
      --muted: #667085;
      --border: #d7deea;
      --soft-blue: #eef5fc;
      --soft-orange: #fff7ed;
    }

    * { box-sizing: border-box; }

    html { scroll-behavior: smooth; }

    body {
      margin: 0;
      background: var(--light);
      color: var(--text);
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.5;
    }

    a { color: inherit; }

    .toolbar {
      max-width: 980px;
      margin: 20px auto 0;
      padding: 0 16px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 11px 16px;
      border: 0;
      border-radius: 8px;
      background: var(--navy);
      color: white;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
    }

    .button.orange { background: var(--orange); }
    .button.whatsapp { background: var(--green); }

    .page {
      max-width: 980px;
      margin: 16px auto 36px;
      background: var(--white);
      border-radius: 16px;
      box-shadow: 0 14px 40px rgba(8, 31, 61, 0.12);
      overflow: hidden;
    }

    .header {
      padding: 30px 36px;
      color: white;
      background: linear-gradient(135deg, var(--navy), var(--blue));
      border-bottom: 7px solid var(--orange);
    }

    .brand-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .logo-placeholder {
      width: 58px;
      height: 58px;
      flex: 0 0 58px;
      border: 2px solid rgba(255,255,255,.7);
      border-radius: 14px;
      display: grid;
      place-items: center;
      font-weight: 800;
      letter-spacing: .5px;
      background: rgba(255,255,255,.08);
    }

    .header h1 {
      margin: 0;
      font-size: 27px;
      letter-spacing: .3px;
    }

    .header h2 {
      margin: 7px 0 0;
      font-size: 18px;
      font-weight: 500;
    }

    .header p {
      margin: 6px 0 0;
      opacity: .88;
      font-size: 14px;
    }

    .content { padding: 28px 34px 38px; }

    .intro {
      margin-bottom: 16px;
      padding: 16px 18px;
      border-left: 5px solid var(--orange);
      border-radius: 9px;
      background: var(--soft-orange);
    }

    .help-box {
      margin-bottom: 26px;
      padding: 15px 18px;
      border-left: 5px solid var(--green);
      border-radius: 9px;
      background: #ecfdf3;
    }

    .help-box a {
      display: inline-block;
      margin-top: 7px;
      color: #087a39;
      font-weight: 800;
      text-decoration: none;
    }

    section {
      margin-bottom: 25px;
      overflow: hidden;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: white;
    }

    .section-title {
      padding: 12px 16px;
      background: var(--soft-blue);
      color: var(--navy);
      border-bottom: 1px solid var(--border);
      font-size: 16px;
      font-weight: 800;
    }

    .section-body { padding: 18px 17px; }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 15px 18px;
    }

    .full { grid-column: 1 / -1; }

    label.field-label {
      display: block;
      margin-bottom: 6px;
      color: #344054;
      font-size: 14px;
      font-weight: 700;
    }

    input[type="text"],
    input[type="tel"],
    input[type="email"],
    input[type="date"],
    textarea,
    select {
      width: 100%;
      min-height: 42px;
      padding: 10px 11px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: white;
      color: var(--text);
      font: inherit;
    }

    textarea {
      min-height: 84px;
      resize: vertical;
    }

    input:focus,
    textarea:focus,
    select:focus {
      outline: 3px solid rgba(15, 76, 129, .13);
      border-color: var(--blue);
    }

    .checkbox-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 11px 14px;
    }

    .choice {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      color: #344054;
      font-size: 14px;
    }

    .choice input { margin-top: 3px; }

    .note {
      margin: 0 0 15px;
      color: var(--muted);
      font-size: 13px;
    }

    .divider {
      height: 1px;
      margin: 19px 0;
      background: var(--border);
    }

    .experience-card {
      margin-bottom: 16px;
      padding: 15px;
      border: 1px solid #e4e8f0;
      border-radius: 10px;
      background: #fcfdff;
    }

    .experience-card h3 {
      margin: 0 0 13px;
      color: var(--blue);
      font-size: 15px;
    }

    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 25px;
      margin-top: 20px;
    }

    .signature-line {
      height: 42px;
      border-bottom: 1px solid #111827;
    }

    .office-use {
      border-style: dashed;
      background: #fafafa;
    }

    .declaration {
      margin: 0;
      color: #344054;
    }

    .footer {
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      text-align: center;
      color: var(--muted);
      font-size: 12px;
    }

    .footer a {
      color: var(--blue);
      font-weight: 700;
      text-decoration: none;
    }

    @media (max-width: 760px) {
      .toolbar { display: none; }
      .page { margin: 0; border-radius: 0; box-shadow: none; }
      .header, .content { padding: 22px 18px; }
      .grid, .signature-grid { grid-template-columns: 1fr; }
      .full { grid-column: auto; }
      .checkbox-grid { grid-template-columns: 1fr; }
      .header h1 { font-size: 22px; }
    }

    @media print {
      @page { size: A4; margin: 12mm; }

      body { background: white; }
      .toolbar { display: none !important; }
      .page {
        max-width: none;
        margin: 0;
        border-radius: 0;
        box-shadow: none;
      }

      .header,
      .section-title,
      .intro,
      .help-box {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      section,
      .experience-card {
        break-inside: avoid;
      }

      input,
      textarea,
      select {
        background: white;
      }
    }
  `}</style>
  <div className="toolbar">
    <a className="button whatsapp" href="https://wa.me/2347068169227" target="_blank" rel="noopener">WhatsApp ESS</a>
    <button className="button orange" type="button" onClick={() => window.print()}>Print / Save as PDF</button>
  </div>

  <main className="page">
    <header className="header">
      <div className="brand-row">
        <div className="logo-placeholder" aria-label="ESS logo placeholder">ESS</div>
        <div>
          <h1>ENTERCOM SECURITY SYSTEMS (ESS)</h1>
          <h2>Technician &amp; Installer Application Form</h2>
          <p>Freelance / Contract Opportunities</p>
        </div>
      </div>
    </header>

    <form className="content" onSubmit={handleSubmit}>
      <div className="intro">
        Thank you for your interest in working with Entercom Security Systems (ESS). We are building a network of skilled and reliable professionals to support security system installation, maintenance, and technical services. Please complete this form accurately.
      </div>

      <div className="help-box">
        <strong>Need help with this application?</strong><br />
        Contact ESS directly on WhatsApp.
        <br />
        <a href="https://wa.me/2347068169227" target="_blank" rel="noopener">0706 816 9227</a>
      </div>

      <section>
        <div className="section-title">1. Personal Information</div>
        <div className="section-body">
          <div className="grid">
            <div>
              <label className="field-label" htmlFor="full-name">Full Name</label>
              <input id="full-name" name="full_name" type="text" />
            </div>
            <div>
              <label className="field-label" htmlFor="phone">Phone Number</label>
              <input id="phone" name="phone" type="tel" />
            </div>
            <div>
              <label className="field-label" htmlFor="whatsapp">WhatsApp Number</label>
              <input id="whatsapp" name="whatsapp" type="tel" />
            </div>
            <div>
              <label className="field-label" htmlFor="email">Email Address</label>
              <input id="email" name="email" type="email" />
            </div>
            <div className="full">
              <label className="field-label" htmlFor="address">Residential Address</label>
              <textarea id="address" name="address"></textarea>
            </div>
            <div>
              <label className="field-label" htmlFor="state">State</label>
              <input id="state" name="state" type="text" />
            </div>
            <div>
              <label className="field-label" htmlFor="lga">Local Government Area (LGA)</label>
              <input id="lga" name="lga" type="text" />
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="section-title">2. Position Applying For</div>
        <div className="section-body">
          <div className="checkbox-grid">
            <label className="choice"><input type="checkbox" name="position" value="installer" /> Security System Installer</label>
            <label className="choice"><input type="checkbox" name="position" value="technician" /> Security System Technician</label>
            <label className="choice"><input type="checkbox" name="position" value="both" /> Both</label>
          </div>
        </div>
      </section>

      <section>
        <div className="section-title">3. Preferred Engagement Type</div>
        <div className="section-body">
          <div className="checkbox-grid">
            <label className="choice"><input type="checkbox" name="engagement" value="freelance" /> Freelance</label>
            <label className="choice"><input type="checkbox" name="engagement" value="contract" /> Contract</label>
            <label className="choice"><input type="checkbox" name="engagement" value="part-time" /> Part-Time</label>
            <label className="choice"><input type="checkbox" name="engagement" value="future-full-time" /> Full-Time (Future Opportunities)</label>
          </div>
        </div>
      </section>

      <section>
        <div className="section-title">4. Technical Experience</div>
        <div className="section-body">
          <label className="field-label">Years of Experience</label>
          <div className="checkbox-grid">
            <label className="choice"><input type="radio" name="experience_years" value="under-1" /> Less than 1 year</label>
            <label className="choice"><input type="radio" name="experience_years" value="1-3" /> 1–3 years</label>
            <label className="choice"><input type="radio" name="experience_years" value="3-5" /> 3–5 years</label>
            <label className="choice"><input type="radio" name="experience_years" value="over-5" /> More than 5 years</label>
          </div>

          <div className="divider"></div>

          <label className="field-label">Areas of Experience — tick all that apply</label>
          <div className="checkbox-grid">
            <label className="choice"><input type="checkbox" name="skills" value="cctv" /> CCTV Installation</label>
            <label className="choice"><input type="checkbox" name="skills" value="ip-camera" /> IP Camera Systems</label>
            <label className="choice"><input type="checkbox" name="skills" value="analog-camera" /> Analog Camera Systems</label>
            <label className="choice"><input type="checkbox" name="skills" value="dvr-nvr" /> DVR/NVR Configuration</label>
            <label className="choice"><input type="checkbox" name="skills" value="network-cabling" /> Network Cabling</label>
            <label className="choice"><input type="checkbox" name="skills" value="fiber" /> Fiber Installation</label>
            <label className="choice"><input type="checkbox" name="skills" value="access-control" /> Access Control Systems</label>
            <label className="choice"><input type="checkbox" name="skills" value="biometric" /> Biometric Systems</label>
            <label className="choice"><input type="checkbox" name="skills" value="motion-sensors" /> Motion Sensors</label>
            <label className="choice"><input type="checkbox" name="skills" value="door-sensors" /> Door/Window Sensors</label>
            <label className="choice"><input type="checkbox" name="skills" value="alarm" /> Alarm Systems</label>
            <label className="choice"><input type="checkbox" name="skills" value="electric-fence" /> Electric Fence</label>
            <label className="choice"><input type="checkbox" name="skills" value="smart-home" /> Smart Home Installation</label>
            <label className="choice"><input type="checkbox" name="skills" value="ups" /> UPS &amp; Backup Power</label>
            <label className="choice"><input type="checkbox" name="skills" value="solar" /> Solar Installation</label>
            <label className="choice"><input type="checkbox" name="skills" value="networking" /> Routers &amp; Network Switches</label>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label className="field-label" htmlFor="other-experience">Other relevant experience</label>
            <textarea id="other-experience" name="other_experience"></textarea>
          </div>
        </div>
      </section>

      <section>
        <div className="section-title">5. Tools &amp; Equipment</div>
        <div className="section-body">
          <label className="field-label">Do you own your installation tools?</label>
          <div className="checkbox-grid">
            <label className="choice"><input type="radio" name="owns_tools" value="yes" /> Yes</label>
            <label className="choice"><input type="radio" name="owns_tools" value="no" /> No</label>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label className="field-label" htmlFor="tools-list">If yes, list the major tools you own</label>
            <textarea id="tools-list" name="tools_list"></textarea>
          </div>
        </div>
      </section>

      <section>
        <div className="section-title">6. Past Work Experience</div>
        <div className="section-body">
          <p className="note">Provide your last two or three most recent work experiences, contracts, or major projects related to security systems, electrical installation, networking, or similar technical work.</p>

          <div className="experience-card">
            <h3>Work Experience #1</h3>
            <div className="grid">
              <div>
                <label className="field-label">Company / Organization / Client</label>
                <input type="text" name="work1_company" />
              </div>
              <div>
                <label className="field-label">Position / Role Held</label>
                <input type="text" name="work1_role" />
              </div>
              <div>
                <label className="field-label">Employment Type</label>
                <select name="work1_type">
                  <option value="">Select one</option>
                  <option>Full-Time</option>
                  <option>Part-Time</option>
                  <option>Contract</option>
                  <option>Freelance</option>
                </select>
              </div>
              <div>
                <label className="field-label">Period of Engagement</label>
                <input type="text" name="work1_period" placeholder="Example: Jan 2024 – Dec 2025" />
              </div>
              <div className="full">
                <label className="field-label">Key Responsibilities</label>
                <textarea name="work1_responsibilities"></textarea>
              </div>
              <div className="full">
                <label className="field-label">Reason for Leaving / Contract Completion</label>
                <textarea name="work1_reason"></textarea>
              </div>
            </div>
          </div>

          <div className="experience-card">
            <h3>Work Experience #2</h3>
            <div className="grid">
              <div>
                <label className="field-label">Company / Organization / Client</label>
                <input type="text" name="work2_company" />
              </div>
              <div>
                <label className="field-label">Position / Role Held</label>
                <input type="text" name="work2_role" />
              </div>
              <div>
                <label className="field-label">Employment Type</label>
                <select name="work2_type">
                  <option value="">Select one</option>
                  <option>Full-Time</option>
                  <option>Part-Time</option>
                  <option>Contract</option>
                  <option>Freelance</option>
                </select>
              </div>
              <div>
                <label className="field-label">Period of Engagement</label>
                <input type="text" name="work2_period" placeholder="Example: Jan 2022 – Dec 2023" />
              </div>
              <div className="full">
                <label className="field-label">Key Responsibilities</label>
                <textarea name="work2_responsibilities"></textarea>
              </div>
              <div className="full">
                <label className="field-label">Reason for Leaving / Contract Completion</label>
                <textarea name="work2_reason"></textarea>
              </div>
            </div>
          </div>

          <div className="experience-card">
            <h3>Work Experience #3 — Optional</h3>
            <div className="grid">
              <div>
                <label className="field-label">Company / Organization / Client</label>
                <input type="text" name="work3_company" />
              </div>
              <div>
                <label className="field-label">Position / Role Held</label>
                <input type="text" name="work3_role" />
              </div>
              <div>
                <label className="field-label">Employment Type</label>
                <select name="work3_type">
                  <option value="">Select one</option>
                  <option>Full-Time</option>
                  <option>Part-Time</option>
                  <option>Contract</option>
                  <option>Freelance</option>
                </select>
              </div>
              <div>
                <label className="field-label">Period of Engagement</label>
                <input type="text" name="work3_period" />
              </div>
              <div className="full">
                <label className="field-label">Key Responsibilities</label>
                <textarea name="work3_responsibilities"></textarea>
              </div>
              <div className="full">
                <label className="field-label">Reason for Leaving / Contract Completion</label>
                <textarea name="work3_reason"></textarea>
              </div>
            </div>
          </div>

          <div className="divider"></div>

          <label className="field-label">Types of systems previously installed — tick all that apply</label>
          <div className="checkbox-grid">
            <label className="choice"><input type="checkbox" name="past_systems" value="residential-cctv" /> Residential CCTV Systems</label>
            <label className="choice"><input type="checkbox" name="past_systems" value="commercial-cctv" /> Commercial CCTV Systems</label>
            <label className="choice"><input type="checkbox" name="past_systems" value="access-control" /> Access Control Systems</label>
            <label className="choice"><input type="checkbox" name="past_systems" value="biometric-attendance" /> Biometric Attendance Systems</label>
            <label className="choice"><input type="checkbox" name="past_systems" value="intrusion-alarm" /> Intrusion Alarm Systems</label>
            <label className="choice"><input type="checkbox" name="past_systems" value="electric-fence" /> Electric Fence Systems</label>
            <label className="choice"><input type="checkbox" name="past_systems" value="video-doorbells" /> Video Doorbells</label>
            <label className="choice"><input type="checkbox" name="past_systems" value="structured-cabling" /> Structured Network Cabling</label>
            <label className="choice"><input type="checkbox" name="past_systems" value="fiber-cabling" /> Fiber-Optic Cabling</label>
            <label className="choice"><input type="checkbox" name="past_systems" value="smart-home" /> Smart Home Devices</label>
            <label className="choice"><input type="checkbox" name="past_systems" value="solar" /> Solar Power Systems</label>
            <label className="choice"><input type="checkbox" name="past_systems" value="other" /> Other</label>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label className="field-label">Describe one security installation project you are most proud of</label>
            <textarea name="proud_project"></textarea>
          </div>
          <div style={{ marginTop: '14px' }}>
            <label className="field-label">Your role on the project</label>
            <textarea name="project_role"></textarea>
          </div>
          <div style={{ marginTop: '14px' }}>
            <label className="field-label">Major challenge faced and outcome</label>
            <textarea name="project_challenges"></textarea>
          </div>
        </div>
      </section>

      <section>
        <div className="section-title">7. Availability</div>
        <div className="section-body">
          <label className="field-label">Days available</label>
          <div className="checkbox-grid">
            <label className="choice"><input type="checkbox" name="available_days" value="monday" /> Monday</label>
            <label className="choice"><input type="checkbox" name="available_days" value="tuesday" /> Tuesday</label>
            <label className="choice"><input type="checkbox" name="available_days" value="wednesday" /> Wednesday</label>
            <label className="choice"><input type="checkbox" name="available_days" value="thursday" /> Thursday</label>
            <label className="choice"><input type="checkbox" name="available_days" value="friday" /> Friday</label>
            <label className="choice"><input type="checkbox" name="available_days" value="saturday" /> Saturday</label>
            <label className="choice"><input type="checkbox" name="available_days" value="sunday" /> Sunday</label>
          </div>

          <div className="divider"></div>

          <label className="field-label">Can you travel for installations?</label>
          <div className="checkbox-grid">
            <label className="choice"><input type="radio" name="can_travel" value="yes" /> Yes</label>
            <label className="choice"><input type="radio" name="can_travel" value="no" /> No</label>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label className="field-label">Maximum distance or locations you are willing to travel</label>
            <input type="text" name="travel_limit" />
          </div>
        </div>
      </section>

      <section>
        <div className="section-title">8. Transportation</div>
        <div className="section-body">
          <label className="field-label">Your usual means of transportation</label>
          <div className="checkbox-grid">
            <label className="choice"><input type="checkbox" name="transport" value="motorcycle" /> Motorcycle</label>
            <label className="choice"><input type="checkbox" name="transport" value="car" /> Car</label>
            <label className="choice"><input type="checkbox" name="transport" value="public" /> Public Transport</label>
            <label className="choice"><input type="checkbox" name="transport" value="other" /> Other</label>
          </div>
          <div style={{ marginTop: '15px' }}>
            <label className="field-label">If other, please specify</label>
            <input type="text" name="transport_other" />
          </div>
        </div>
      </section>

      <section>
        <div className="section-title">9. Certifications &amp; Training — Optional</div>
        <div className="section-body">
          <label className="field-label">List relevant technical, vocational, manufacturer, or safety certifications and training</label>
          <textarea name="certifications"></textarea>
        </div>
      </section>

      <section>
        <div className="section-title">10. References</div>
        <div className="section-body">
          <div className="experience-card">
            <h3>Reference #1</h3>
            <div className="grid">
              <div>
                <label className="field-label">Name</label>
                <input type="text" name="reference1_name" />
              </div>
              <div>
                <label className="field-label">Phone Number</label>
                <input type="tel" name="reference1_phone" />
              </div>
              <div className="full">
                <label className="field-label">Relationship to Applicant</label>
                <input type="text" name="reference1_relationship" />
              </div>
            </div>
          </div>

          <div className="experience-card">
            <h3>Reference #2</h3>
            <div className="grid">
              <div>
                <label className="field-label">Name</label>
                <input type="text" name="reference2_name" />
              </div>
              <div>
                <label className="field-label">Phone Number</label>
                <input type="tel" name="reference2_phone" />
              </div>
              <div className="full">
                <label className="field-label">Relationship to Applicant</label>
                <input type="text" name="reference2_relationship" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="section-title">11. Applicant Document Checklist</div>
        <div className="section-body">
          <p className="note">Submit copies where applicable. Evidence of previous installation work may include project photos or a simple portfolio.</p>
          <div className="checkbox-grid">
            <label className="choice"><input type="checkbox" name="documents" value="cv" /> CV / Résumé</label>
            <label className="choice"><input type="checkbox" name="documents" value="government-id" /> Government-Issued ID</label>
            <label className="choice"><input type="checkbox" name="documents" value="passport-photo" /> Passport Photograph</label>
            <label className="choice"><input type="checkbox" name="documents" value="certifications" /> Technical Certifications</label>
            <label className="choice"><input type="checkbox" name="documents" value="drivers-license" /> Driver’s License</label>
            <label className="choice"><input type="checkbox" name="documents" value="trade-test" /> Trade Test / Vocational Certificate</label>
            <label className="choice"><input type="checkbox" name="documents" value="portfolio" /> Previous Work Photos / Portfolio</label>
            <label className="choice"><input type="checkbox" name="documents" value="other" /> Other Supporting Documents</label>
          </div>
        </div>
      </section>

      <section>
        <div className="section-title">12. Declaration</div>
        <div className="section-body">
          <p className="declaration">
            I certify that the information provided in this application is true and complete to the best of my knowledge. I understand that submission of this form does not guarantee employment, project assignment, or contract engagement with Entercom Security Systems (ESS). I authorize ESS to verify the information and references provided, subject to applicable requirements.
          </p>

          <div className="signature-grid">
            <div>
              <label className="field-label">Applicant Signature</label>
              <div className="signature-line"></div>
            </div>
            <div>
              <label className="field-label">Date</label>
              <div className="signature-line"></div>
            </div>
          </div>
        </div>
      </section>

      
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" disabled={isPending} className="button" style={{ background: 'var(--blue)', fontSize: '16px', padding: '14px 24px' }}>
          {isPending ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </form>
  </main>

    </>
  );
}
