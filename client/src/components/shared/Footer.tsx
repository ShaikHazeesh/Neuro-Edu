import { Link } from "wouter";

const footerLinks = {
  courses: [
    { name: "Web Development", href: "/courses/web-development" },
    { name: "Python Programming", href: "/courses/python" },
    { name: "JavaScript", href: "/courses/javascript" },
    { name: "Data Science", href: "/courses/data-science" },
    { name: "Mobile App Development", href: "/courses/mobile-apps" },
    { name: "Course Catalog", href: "/courses" },
  ],
  resources: [
    { name: "Mental Health Tools", href: "/mental-health" },
    { name: "Community Forum", href: "/community" },
    { name: "Cheat Sheets", href: "/cheat-sheets" },
    { name: "Blog", href: "/blog" },
    { name: "Support Center", href: "/support" },
    { name: "Crisis Resources", href: "/mental-health/crisis" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Our Mission", href: "/mission" },
    { name: "Mental Health Approach", href: "/approach" },
    { name: "Partnerships", href: "/partnerships" },
    { name: "Careers", href: "/careers" },
    { name: "Contact Us", href: "/contact" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "Accessibility", href: "/accessibility" },
  ],
  social: [
    { name: "facebook", href: "https://facebook.com" },
    { name: "twitter", href: "https://twitter.com" },
    { name: "instagram", href: "https://instagram.com" },
    { name: "linkedin", href: "https://linkedin.com" },
  ]
};

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-12 px-4 transition-colors duration-300">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <div className="mr-2 text-primary dark:text-accent">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l8 4A1 1 0 0119 6v8a1 1 0 01-.504.868l-8 4a1 1 0 01-.992 0l-8-4A1 1 0 011 14V6a1 1 0 01.504-.868l8-4zM8 7a1 1 0 00-1 1v5a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-xl font-outfit font-semibold">Neuro Edu</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
              Supporting students' mental health while building programming skills.
            </p>
            <div className="flex space-x-4">
              {footerLinks.social.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="text-gray-400 hover:text-primary dark:hover:text-accent transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow us on ${social.name}`}
                >
                  <span className="material-icons">{social.name}</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-outfit font-semibold mb-4">Courses</h3>
            <ul className="space-y-2 text-sm">
              {footerLinks.courses.map((link, index) => (
                <li key={index}>
                  <Link href={link.href}>
                    <a className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-accent transition-colors">
                      {link.name}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-outfit font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <Link href={link.href}>
                    <a className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-accent transition-colors">
                      {link.name}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-outfit font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link href={link.href}>
                    <a className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-accent transition-colors">
                      {link.name}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 md:mb-0">
            © {new Date().getFullYear()} Neuro Edu. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            {footerLinks.legal.map((link, index) => (
              <Link key={index} href={link.href}>
                <a className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-accent transition-colors">
                  {link.name}
                </a>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
