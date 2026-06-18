export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: June 2026</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Who we are</h2>
            <p>
              ClinicFlow is a clinic management platform operated by ClinicFlow Ltd. We act as a data processor on behalf of the healthcare clinics (data controllers) that use our service. This policy explains what personal data we handle, why, and what rights you have.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. What data we collect</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Patient data:</strong> name, date of birth, contact details, gender, medical history, vital signs, diagnoses, prescriptions, and appointment records.</li>
              <li><strong>Staff data:</strong> name, email address, role, and login session information.</li>
              <li><strong>Clinic data:</strong> clinic name, address, billing details.</li>
              <li><strong>Usage data:</strong> IP addresses recorded in the audit log for security and compliance purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Legal basis for processing</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Consent (Art. 6(1)(a) / Art. 9(2)(a) GDPR):</strong> Patient health data is processed only when explicit consent has been recorded.</li>
              <li><strong>Contract (Art. 6(1)(b)):</strong> Staff and billing data are processed to fulfil the service contract with the clinic.</li>
              <li><strong>Legal obligation (Art. 6(1)(c)):</strong> Audit logs are kept to satisfy applicable healthcare record-keeping requirements.</li>
              <li><strong>Legitimate interests (Art. 6(1)(f)):</strong> Session security and fraud prevention.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Retention periods</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Patient records:</strong> Retained for the period required by the clinic's applicable law (typically 10 years after last treatment), then deleted on clinic request.</li>
              <li><strong>Audit logs:</strong> 3 years from creation.</li>
              <li><strong>Session data:</strong> Deleted automatically on logout or after session expiry.</li>
              <li><strong>Billing records:</strong> 7 years (tax compliance).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Your rights</h2>
            <p>Under GDPR, patients and staff have the following rights:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Right of access (Art. 15):</strong> Request a copy of all data held about you.</li>
              <li><strong>Right to portability (Art. 20):</strong> Receive your data in a machine-readable format (JSON export available via clinic admin).</li>
              <li><strong>Right to erasure (Art. 17):</strong> Request permanent deletion of your personal data (subject to legal retention obligations).</li>
              <li><strong>Right to rectification (Art. 16):</strong> Ask the clinic to correct inaccurate data.</li>
              <li><strong>Right to object (Art. 21):</strong> Object to processing based on legitimate interests.</li>
              <li><strong>Right to restrict processing (Art. 18):</strong> Ask us to pause processing while a dispute is resolved.</li>
            </ul>
            <p className="mt-3">
              To exercise any right, contact the clinic that holds your records. They will handle the request as data controller. For platform-level requests, contact us at the address below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Cookies</h2>
            <p>
              ClinicFlow uses a single strictly necessary session cookie (<code>clinicflow_session</code>) to keep you logged in. This cookie is exempt from consent requirements under the ePrivacy Directive Art. 5(3) because it is essential for the service to function. No tracking, analytics, or advertising cookies are used.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Data transfers</h2>
            <p>
              All data is stored in the European Union (Amsterdam, Netherlands). We do not transfer personal data outside the EEA without adequate safeguards in place.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Security</h2>
            <p>
              Passwords are hashed with bcrypt. Data in transit is encrypted with TLS 1.2+. Access is controlled by role-based permissions configurable per clinic. Sensitive operations are recorded in a tamper-evident audit log.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Contact &amp; DPO</h2>
            <p>
              For data protection enquiries or to exercise your rights, contact us at:{" "}
              <strong>privacy@clinicflow.app</strong>
            </p>
            <p className="mt-2">
              If you are unsatisfied with our response, you have the right to lodge a complaint with your local supervisory authority (e.g. the ICO in the UK, or the relevant DPA in your EU member state).
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} ClinicFlow Ltd · <a href="/login" className="underline hover:text-slate-900">Back to app</a>
        </div>
      </div>
    </div>
  );
}
