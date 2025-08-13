import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ZoomIn, Pencil, Cpu, Brain, BarChart3, Shield, Clock, Users, CheckCircle, Upload, Eye, FileCheck, Link2, Settings, ArrowRight } from 'lucide-react';

const Feature = ({ icon: Icon, title, description, linkTo, linkText }) => (
  <div className="transform transition-all duration-200 hover:scale-105">
    <div className="relative bg-white rounded-xl shadow-lg p-6 hover:shadow-xl h-full flex flex-col">
      <div className="absolute -top-4 left-4">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-lg">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="pt-8 flex-grow">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        <p className="mt-4 text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>
      {linkTo && (
        <div className="mt-6">
          <Link
            to={linkTo}
            className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors duration-200"
          >
            {linkText}
            <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  </div>
);

const Step = ({ number, icon: Icon, title, description }) => (
  <div className="flex flex-col items-center text-center">
    <div className="relative mb-4">
      <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
        <Icon className="w-8 h-8 text-white" />
      </div>
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center">
        <span className="text-xs font-bold text-orange-800">{number}</span>
      </div>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

const ValueProp = ({ icon: Icon, title, description }) => (
  <div className="flex items-start space-x-3">
    <div className="flex-shrink-0">
      <Icon className="w-6 h-6 text-orange-600 mt-1" />
    </div>
    <div>
      <h4 className="font-semibold text-gray-900">{title}</h4>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  </div>
);

const mainTools = [
  {
    icon: Cpu,
    title: "AI Dent Detection",
    description: "Upload photos and get dent counts by size (Nickel, Quarter, Half-Dollar, Oversize). Review and adjust in minutes.",
    linkTo: "/display",
    linkText: "Start Detection"
  },
  {
    icon: Link2,
    title: "Appraisal Tech - Vehicle Verification",
    description: "Appraisal Tech is a growing suite of tools. Start with Vehicle Verification: create a claim, capture adjuster details, and send a secure link. Submissions attach to the claim automatically.",
    linkTo: "/appraiser",
    linkText: "Open Appraisal Tech"
  }
];

const appraiserSteps = [
  {
    number: 1,
    icon: Settings,
    title: "Create Public Claim",
    description: "Upload the claim document (optional) and enter the adjuster's first name, last name, and email."
  },
  {
    number: 2,
    icon: Link2,
    title: "Send Secure Link",
    description: "A scoped, expiring verification link (no login) is sent to the claimant."
  },
  {
    number: 3,
    icon: Eye,
    title: "Claimant Completes Verification",
    description: "They open the link and submit the required photos and details."
  },
  {
    number: 4,
    icon: CheckCircle,
    title: "Receive Results",
    description: "Photos and notes post into the claim automatically. A confirmation email includes the submission summary."
  }
];

const detectionSteps = [
  {
    number: 1,
    icon: Upload,
    title: "Upload Photos",
    description: "Front, rear, sides, roof—or your standard capture set."
  },
  {
    number: 2,
    icon: Brain,
    title: "Get Instant Analysis",
    description: "AI detects and classifies dents by size with confidence scores."
  },
  {
    number: 3,
    icon: FileCheck,
    title: "Verify & Export",
    description: "Confirm results and export for your workflow."
  }
];

const valueProps = [
  {
    icon: Cpu,
    title: "Fast & Accurate",
    description: "Models trained on real claim photos."
  },
  {
    icon: Link2,
    title: "No-Login Links",
    description: "Secure, tokenized, scoped to one claim."
  },
  {
    icon: Users,
    title: "Human in the Loop",
    description: "Simple tools to confirm or correct AI."
  },
  {
    icon: Settings,
    title: "Plug-and-Play",
    description: "Uses your existing routes and data."
  }
];

const securityFeatures = [
  {
    icon: Shield,
    title: "Scoped Ownership",
    description: "Tokens tie each submission to the right org and claim."
  },
  {
    icon: Clock,
    title: "Expiring Access",
    description: "Links expire automatically; revoke/resend anytime."
  },
  {
    icon: CheckCircle,
    title: "Safe Uploads",
    description: "File size/type limits; optional EXIF/GPS removal."
  },
  {
    icon: Search,
    title: "Data Minimization",
    description: "VIN/plate not logged; tokens hashed in logs."
  }
];

export default function MainPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600 sm:text-6xl md:text-7xl">
            Dent Detection & Appraisal Tech - simple, fast
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Two options: run AI dent detection or send a secure verification link. No logins.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/display"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-lg transition-colors duration-200 space-x-2"
            >
              <Cpu className="w-5 h-5" />
              <span>Start Dent Detection</span>
            </Link>
            <Link
              to="/appraiser"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-orange-500 bg-white hover:bg-gray-50 rounded-lg shadow-lg transition-colors duration-200 border border-orange-100 space-x-2"
            >
              <Link2 className="w-5 h-5" />
              <span>Open Appraisal Tech</span>
            </Link>
          </div>

          {/* Micro-note */}
          <p className="mt-4 text-sm text-gray-500">
            Works on mobile • No setup
          </p>
        </div>

        {/* What You Can Do - Main Tools */}
        <div className="mt-32">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            Choose Your Tool
          </h2>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {mainTools.map((tool, index) => (
              <Feature key={index} {...tool} />
            ))}
          </div>
        </div>

        {/* How it Works - Appraiser Tools */}
        <div className="mt-32">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            How it Works - Appraisal Tech (Vehicle Verification)
          </h2>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 mb-12">
            {appraiserSteps.map((step, index) => (
              <Step key={index} {...step} />
            ))}
          </div>
          <div className="text-center">
            <Link
              to="/appraiser"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-lg transition-colors duration-200 space-x-2"
            >
              <Link2 className="w-5 h-5" />
              <span>Open Appraisal Tech</span>
            </Link>
          </div>
        </div>

        {/* How it Works - Dent Detection */}
        <div className="mt-32 bg-gradient-to-r from-orange-50 to-orange-100 py-16 px-4 rounded-2xl">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            How it Works - Dent Detection
          </h2>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3 mb-12">
            {detectionSteps.map((step, index) => (
              <Step key={index} {...step} />
            ))}
          </div>
          <div className="text-center">
            <Link
              to="/display"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-lg transition-colors duration-200 space-x-2"
            >
              <Cpu className="w-5 h-5" />
              <span>Start Dent Detection</span>
            </Link>
          </div>
        </div>

        {/* Supported Categories */}
        <div className="mt-32">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            Supported Dent Categories
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-lg shadow p-6 flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-purple-500"></div>
              </div>
              <div>
                <h3 className="text-lg font-medium">Nickel</h3>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-500"></div>
              </div>
              <div>
                <h3 className="text-lg font-medium">Quarter</h3>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-green-500"></div>
              </div>
              <div>
                <h3 className="text-lg font-medium">Half-Dollar</h3>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-yellow-500"></div>
              </div>
              <div>
                <h3 className="text-lg font-medium">Oversize</h3>
              </div>
            </div>
          </div>
        </div>



        {/* Final CTA */}
        <div className="mt-32 bg-gradient-to-r from-orange-500 to-orange-600 py-16 px-6 rounded-2xl text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to try it?</h2>
          <p className="text-xl mb-8 text-orange-100">
            Get a live demo and a demo claim set up.
          </p>
          <a
            href="https://calendly.com/team-obai/intro-conversation"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-orange-600 bg-white hover:bg-gray-50 rounded-lg shadow-lg transition-colors duration-200 space-x-2"
          >
            <span>Schedule a Demo</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}