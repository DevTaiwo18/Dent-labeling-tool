import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, FileOutput, Sparkles } from 'lucide-react';

const Feature = ({ icon: Icon, title, description }) => (
  <div className="transform transition-all duration-200 hover:scale-105">
    <div className="relative bg-white rounded-xl shadow-lg p-6 hover:shadow-xl">
      <div className="absolute -top-4 left-4">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg">
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
    icon: Camera,
    title: "Intelligent Image Labeling",
    description: "Advanced tools for precise dent marking and classification. Supports multiple annotation types with real-time validation and preview."
  },
  {
    icon: FileOutput,
    title: "Versatile Export Options",
    description: "Export datasets in industry-standard formats including COCO, YOLO, and Pascal VOC. Perfect for machine learning model training."
  },
  {
    icon: Sparkles,
    title: "AI-Powered Assistance",
    description: "Leverage cutting-edge AI to automate repetitive tasks, ensure labeling consistency, and dramatically improve workflow efficiency."
  }
];

export default function MainPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 sm:text-6xl md:text-7xl">
            Dent Detection Platform
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Create high-quality training datasets for AI-powered dent detection systems using our advanced labeling platform.
          </p>
          
          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/label"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg transition-colors duration-200 space-x-2"
            >
              <Camera className="w-5 h-5" />
              <span>Start Labeling</span>
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-blue-600 bg-white hover:bg-gray-50 rounded-lg shadow-lg transition-colors duration-200 border border-blue-100"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mt-32">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            Powerful Features for Precise Labeling
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 cursor-pointer">
            {features.map((feature, index) => (
              <Feature key={index} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}