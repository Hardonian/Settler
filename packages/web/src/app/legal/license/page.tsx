import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AnimatedPageWrapper } from '@/components/AnimatedPageWrapper';

export default function LicensePage() {
  return (
    <AnimatedPageWrapper aria-label="License page">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-slate-900 dark:text-white">License</h1>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            <strong>MIT License</strong>
          </p>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Copyright (c) 2025 Scott Hardie
          </p>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Permission is hereby granted, free of charge, to any person obtaining a copy
            of this software and associated documentation files (the "Software"), to deal
            in the Software without restriction, including without limitation the rights
            to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
            copies of the Software, and to permit persons to whom the Software is
            furnished to do so, subject to the following conditions:
          </p>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            The above copyright notice and this permission notice shall be included in all
            copies or substantial portions of the Software.
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
            IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
            AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
            LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
            OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
            SOFTWARE.
          </p>
          <p className="text-slate-600 dark:text-slate-300 mt-6">
            For the complete license text, please visit our 
            <a href="https://github.com/shardie-github/Settler-API" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
              GitHub repository
            </a>.
          </p>
        </div>
      </div>
      <Footer />
    </AnimatedPageWrapper>
  );
}
