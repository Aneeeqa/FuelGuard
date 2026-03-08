import { useState } from 'react';
import { Mail, MessageCircle, HelpCircle, ChevronDown, ChevronUp, Send } from 'lucide-react';
import Button from '../components/ui/Button';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      question: 'How do I add fuel entries?',
      answer: 'Go to the "Add Entry" page or click the "+" button. Enter the odometer reading, fuel amount, and price. The app will automatically calculate your mileage and detect any unusual drops that might indicate theft.',
    },
    {
      id: 2,
      question: 'How does theft detection work?',
      answer: 'Theft detection analyzes your mileage patterns. If your mileage drops more than 25% below your average, the entry is flagged as suspicious. Check flagged entries in the History page for details.',
    },
    {
      id: 3,
      question: 'Can I track multiple vehicles?',
      answer: 'Yes! Go to the Vehicles page to add multiple vehicles. Each vehicle can have its own settings, logs, and assigned drivers. Use the vehicle selector in Settings to switch between vehicles.',
    },
    {
      id: 4,
      question: 'How do I set up geofencing?',
      answer: 'Go to Settings > Geofencing Zones. Add your home, work, or other safe zones by entering the coordinates or using your current location. You\'ll receive alerts if your vehicle moves outside these zones.',
    },
    {
      id: 5,
      question: 'What units does the app support?',
      answer: 'FuelGuard supports both Metric (km, L, km/L) and US Customary (mi, gal, mpg) units. Change your preference in Settings > Quick Settings > Measurement System.',
    },
    {
      id: 6,
      question: 'Is my data stored securely?',
      answer: 'All your data is stored locally on your device using IndexedDB or LocalStorage. No data is sent to external servers, ensuring complete privacy and security.',
    },
    {
      id: 7,
      question: 'How do I export my data?',
      answer: 'Go to the History page and click the "Export" button to download your fuel logs as a CSV file. You can also use this data for backup or analysis in other tools.',
    },
    {
      id: 8,
      question: 'Can I use the app offline?',
      answer: 'Yes! FuelGuard works completely offline. All features function without an internet connection, including adding entries, viewing history, and detecting theft.',
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log('Contact form submitted:', formData);
    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 pb-24 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Help & Support
        </h1>
        <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
          Get answers to common questions or reach out to us
        </p>
      </div>

      <div
        className="rounded-xl p-6"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-blue) 15%, transparent)',
            }}
          >
            <HelpCircle className="w-6 h-6" style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Frequently Asked Questions
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Quick answers to common questions
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="rounded-lg border overflow-hidden transition-all duration-200"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-input)',
              }}
            >
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full px-4 py-4 flex items-center justify-between text-left transition-colors hover:bg-black/5"
                style={{ color: 'var(--text-primary)' }}
              >
                <span className="font-medium pr-4">{faq.question}</span>
                {expandedFaq === faq.id ? (
                  <ChevronUp className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent-blue)' }} />
                ) : (
                  <ChevronDown className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                )}
              </button>
              {expandedFaq === faq.id && (
                <div
                  className="px-4 pb-4 pt-2 border-t animate-fade-in"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div
        className="rounded-xl p-6"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-fuel) 15%, transparent)',
            }}
          >
            <MessageCircle className="w-6 h-6" style={{ color: 'var(--accent-fuel)' }} />
          </div>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Contact Support
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              We're here to help - send us a message
            </p>
          </div>
        </div>

        {submitted ? (
          <div
            className="text-center py-12 px-6 rounded-lg animate-fade-in"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-success) 10%, transparent)',
              border: '1px solid var(--accent-success)',
            }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-success)' }}
            >
              <Send className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Message Sent!
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Thank you for reaching out. We'll get back to you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full px-4 py-3 rounded-xl min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                placeholder="How can we help?"
                required
                className="w-full px-4 py-3 rounded-xl min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Message *
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleChange('message', e.target.value)}
                placeholder="Describe your issue or question..."
                required
                rows={6}
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-colors resize-none"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2"
              style={{ minHeight: '56px', fontSize: '16px' }}
            >
              <Send className="w-5 h-5" />
              Send Message
            </Button>
          </form>
        )}
      </div>

      {/* Alternative Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href="mailto:support@fuelguard.app"
          className="flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 hover-lift"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--accent-blue) 15%, transparent)' }}
          >
            <Mail className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Email Us
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              support@fuelguard.app
            </p>
          </div>
        </a>

        <div
          className="flex items-center gap-3 p-4 rounded-xl border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--accent-fuel) 15%, transparent)' }}
          >
            <HelpCircle className="w-5 h-5" style={{ color: 'var(--accent-fuel)' }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Response Time
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Usually within 24 hours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
