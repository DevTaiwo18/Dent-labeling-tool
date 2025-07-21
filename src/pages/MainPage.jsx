import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ZoomIn, Pencil, Cpu, Brain, BarChart3 } from 'lucide-react';

const Feature = ({ icon: Icon, title, description }) => (
  <div className="transform transition-all duration-200 hover:scale-105">
    <div className="relative bg-white rounded-xl shadow-lg p-6 hover:shadow-xl">
      <div className="absolute -top-4 left-4">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-lg">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="pt-8">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        <p className="mt-4 text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  </div>
);

const features = [
  {
    icon: Cpu,
    title: "AI-Powered Detection",
    description: "Upload images for instant AI analysis. OBAI's advanced machine learning models identify and classify dents with exceptional accuracy."
  },
  {
    icon: ZoomIn,
    title: "Detailed Analysis",
    description: "Zoom in and out to examine details with precision. Our AI-enhanced tools help identify dents across different categories."
  },
  {
    icon: Pencil,
    title: "Manual Verification",
    description: "Use our drawing tools to verify AI detections. Perfect for human-in-the-loop validation of machine learning results."
  }
];

const aiFeatures = [
  {
    icon: Brain,
    title: "Neural Network Processing",
    description: "Our custom neural network architecture has been trained on thousands of images to recognize dent patterns with high precision."
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Get immediate statistical analysis of detection results, including dent counts and classification confidence scores."
  },
  {
    icon: Search,
    title: "Continuous Learning",
    description: "The OBAI system improves over time as more data is processed, increasing accuracy with each detection run."
  }
];

export default function MainPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600 sm:text-6xl md:text-7xl">
            AI-Powered Dent Detection
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Leverage OBAI's advanced artificial intelligence to identify and analyze dents with precision across four key categories: Nickel, Quarter, Half Dollar, and Oversize classifications.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/display"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-lg transition-colors duration-200 space-x-2"
            >
              <Cpu className="w-5 h-5" />
              <span>Start AI Detection</span>
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-orange-500 bg-white hover:bg-gray-50 rounded-lg shadow-lg transition-colors duration-200 border border-orange-100"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mt-32">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            AI-Powered Detection Features
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 cursor-pointer">
            {features.map((feature, index) => (
              <Feature key={index} {...feature} />
            ))}
          </div>
        </div>

        {/* AI Technology Section */}
        <div className="mt-32 bg-gradient-to-r from-orange-50 to-orange-100 py-16 px-4 rounded-2xl">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            OBAI Technology
          </h2>
          <div className="text-center mb-10">
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Our proprietary AI models have been trained on extensive datasets to deliver
              industry-leading accuracy in dent detection and classification.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 cursor-pointer">
            {aiFeatures.map((feature, index) => (
              <Feature key={index} {...feature} />
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div className="mt-32">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            Supported Categories
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
                <h3 className="text-lg font-medium">Half Dollar</h3>
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
      </div>
    </div>
  );
}