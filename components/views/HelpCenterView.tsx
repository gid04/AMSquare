import React, { useState } from 'react';
import { Search, Book, MessageCircle, FileText, ExternalLink, ChevronRight } from 'lucide-react';

const GUIDES = [
  { title: 'Documentation', description: 'Detailed guides on integrating APIs and configuring automation rules.', icon: Book, color: 'text-[#50C913]', bg: 'bg-[#50C913]/10', hover: 'group-hover:bg-[#50C913]', link: 'Browse Docs' },
  { title: 'API Reference', description: 'Technical references for developers building on AMSquare.', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', hover: 'group-hover:bg-blue-600', link: 'View Reference' },
  { title: 'Support Chat', description: 'Chat with our dedicated enterprise support team 24/7.', icon: MessageCircle, color: 'text-purple-600', bg: 'bg-purple-50', hover: 'group-hover:bg-purple-600', link: 'Start Chat' },
];

const ARTICLES = [
  "How to configure multi-region tax compliance?",
  "Understanding the Financial Agent's risk assessment models.",
  "Setting up role-based access control for new staff.",
  "Exporting custom reports to PDF and CSV.",
  "Connecting external bank accounts via Plaid.",
  "Troubleshooting webhook delivery failures.",
  "Generating an invoice with custom branding."
];

export const HelpCenterView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGuides = GUIDES.filter(guide =>
    guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredArticles = ARTICLES.filter(article =>
    article.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
      <div className="text-center space-y-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">How can we help?</h1>
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search for articles, guides, and troubleshooting..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50 bg-white focus:outline-none focus:ring-1 focus:ring-[#50C913] text-base text-slate-900 placeholder:text-slate-400 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredGuides.map((guide, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div className={`w-10 h-10 rounded-xl ${guide.bg} flex items-center justify-center ${guide.color} mb-4 ${guide.hover} group-hover:text-white transition-colors`}>
              <guide.icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">{guide.title}</h3>
            <p className="text-sm text-slate-500 mb-4">{guide.description}</p>
            <span className="text-xs font-bold text-black flex items-center gap-1">{guide.link} <ChevronRight className="w-3 h-3" /></span>
          </div>
        ))}
        {filteredGuides.length === 0 && searchQuery && (
          <div className="col-span-3 text-center p-4 text-slate-400 text-sm">No guides match your search.</div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Popular Articles</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {filteredArticles.length > 0 ? filteredArticles.map((article, i) => (
            <div key={i} className="p-4 px-6 hover:bg-slate-50 flex items-center justify-between cursor-pointer group transition-colors">
              <span className="text-sm text-slate-600 font-medium group-hover:text-black">{article}</span>
              <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
            </div>
          )) : (
            <div className="p-8 text-center text-slate-400 text-sm">No articles found matching "{searchQuery}"</div>
          )}
        </div>
      </div>
    </div>
  );
};