import { Shield, Eye, Lock, Share2, FileText, ArrowRight } from 'lucide-react';

const Privacy = () => {
  const sections = [
    {
      id: 'data-collection',
      icon: Eye,
      title: 'Data Collection',
      content: 'FuelGuard collects the following types of data to provide its services: fuel consumption logs (odometer readings, fuel amounts, prices), vehicle information (make, model, year, fuel type), driver assignments, geofencing zones, and emergency contacts. Location data is only collected when you explicitly enable GPS features.',
    },
    {
      id: 'data-storage',
      icon: Lock,
      title: 'Data Storage',
      content: 'All your data is stored locally on your device using browser storage mechanisms (IndexedDB or LocalStorage). No data is transmitted to external servers or cloud services. Your fuel logs, vehicle profiles, and settings remain completely private and under your control.',
    },
    {
      id: 'data-usage',
      icon: FileText,
      title: 'Data Usage',
      content: 'We use your data solely for: calculating fuel efficiency statistics, detecting unusual mileage patterns that may indicate fuel theft, generating carbon footprint reports, and managing vehicle/driver assignments. Your data is never used for advertising or sold to third parties.',
    },
    {
      id: 'data-sharing',
      icon: Share2,
      title: 'Data Sharing',
      content: 'We do not share your personal data with any third parties. When you use location sharing features (emergency contacts), data is shared directly with the contacts you specify through your device\'s native sharing capabilities. We have no access to or control over this data once shared.',
    },
    {
      id: 'data-security',
      icon: Shield,
      title: 'Data Security',
      content: 'Your data is protected by your device\'s built-in security measures. Browser storage is sandboxed and inaccessible to other websites. We recommend keeping your device locked and using strong device passwords to protect your fuel data from unauthorized access.',
    },
    {
      id: 'your-rights',
      icon: ArrowRight,
      title: 'Your Rights',
      content: 'You have the right to: access all your data through the app\'s history and export features, delete all your data through the Settings > Clear All Data option, export your fuel logs as CSV files, and stop using the app at any time with no penalties or obligations.',
    },
  ];

  return (
    <div className="p-4 lg:p-8 pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{
            background: 'var(--gradient-primary)',
            boxShadow: 'var(--shadow-glow-blue)',
          }}
        >
          <Shield className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Privacy Policy
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
          Your privacy is our priority. Learn how we collect, use, and protect your data.
        </p>
      </div>

      {/* Effective Date */}
      <div
        className="text-center p-4 rounded-xl mb-8"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-blue) 10%, var(--bg-secondary))',
          border: '1px solid var(--accent-blue)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Last Updated: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Recently</span>
        </p>
      </div>

      {/* Privacy Sections */}
      <div className="space-y-6">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              className="rounded-xl p-6 transition-all duration-300"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${
                      index === 0 ? 'var(--accent-blue)' :
                      index === 1 ? 'var(--accent-fuel)' :
                      index === 2 ? 'var(--accent-success)' :
                      index === 3 ? 'var(--accent-alert)' :
                      index === 4 ? 'var(--text-muted)' :
                      'var(--text-secondary)'
                    } 15%, transparent)`,
                  }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{
                      color: index === 0 ? 'var(--accent-blue)' :
                             index === 1 ? 'var(--accent-fuel)' :
                             index === 2 ? 'var(--accent-success)' :
                             index === 3 ? 'var(--accent-alert)' :
                             index === 4 ? 'var(--text-muted)' :
                             'var(--text-secondary)',
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    {section.title}
                  </h2>
                  <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {section.content}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Box */}
      <div
        className="mt-10 p-6 rounded-xl"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-success) 10%, var(--bg-secondary))',
          border: '1px solid var(--accent-success)',
        }}
      >
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Shield className="w-5 h-5" style={{ color: 'var(--accent-success)' }} />
          Privacy in Summary
        </h3>
        <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <li className="flex items-start gap-2">
            <span style={{ color: 'var(--accent-success)' }}>✓</span>
            <span>All data stored locally on your device</span>
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: 'var(--accent-success)' }}>✓</span>
            <span>No data transmitted to external servers</span>
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: 'var(--accent-success)' }}>✓</span>
            <span>Complete control over your data</span>
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: 'var(--accent-success)' }}>✓</span>
            <span>Option to export or delete all data at any time</span>
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: 'var(--accent-success)' }}>✓</span>
            <span>No third-party data sharing</span>
          </li>
        </ul>
      </div>

      {/* Contact Section */}
      <div
        className="mt-10 p-6 rounded-xl"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}
      >
        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Questions About Privacy?
        </h3>
        <p className="text-base mb-4" style={{ color: 'var(--text-secondary)' }}>
          If you have questions about this Privacy Policy or how we handle your data, please contact us through our support page.
        </p>
        <a
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover-lift active-scale"
          style={{
            backgroundColor: 'var(--accent-blue)',
            color: 'white',
          }}
        >
          Contact Support
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default Privacy;
