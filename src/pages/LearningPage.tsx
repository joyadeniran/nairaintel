import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ArrowRight, ArrowLeft, Play, Clock, Star } from 'lucide-react';
import { LearningContent } from '../types';

interface LearningPageProps {
  learningContent: LearningContent[];
  loadingLearn: boolean;
  selectedLesson: LearningContent | null;
  setSelectedLesson: (l: LearningContent | null) => void;
}

export const LearningPage: React.FC<LearningPageProps> = ({ 
  learningContent, 
  loadingLearn, 
  selectedLesson, 
  setSelectedLesson 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-6xl mx-auto space-y-12"
    >
      <AnimatePresence mode="wait">
        {!selectedLesson ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-12"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Learning Hub</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">Master the Nigerian financial landscape.</p>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-display font-bold text-slate-800 dark:text-slate-200">Your Progress</p>
                  <p className="text-xs font-bold text-brand-green">4/12 Lessons Complete</p>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-brand-green/20 border-t-brand-green flex items-center justify-center text-[10px] font-display font-bold text-slate-800 dark:text-white">
                  33%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loadingLearn ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-80 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 animate-pulse border border-slate-100 dark:border-slate-700" />
                ))
              ) : learningContent.map((lesson, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -10 }}
                  onClick={() => setSelectedLesson(lesson)}
                  className="group cursor-pointer premium-card bg-white dark:bg-slate-900 overflow-hidden"
                >
                  <div className="relative h-48">
                    <img src={lesson.image} alt={lesson.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                    <span className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-900 dark:text-white text-[10px] font-display font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20">
                      {lesson.category}
                    </span>
                    <div className="absolute bottom-4 left-4 flex items-center gap-4 text-white">
                      <div className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest">
                        <Clock size={12} /> 15m
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest">
                        <Star size={12} className="text-brand-gold" /> 4.9
                      </div>
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-3 group-hover:text-brand-green transition-colors">{lesson.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 font-medium leading-relaxed">{lesson.description}</p>
                    <button className="flex items-center gap-2 text-sm font-display font-bold text-brand-green group-hover:gap-4 transition-all uppercase tracking-widest">
                      Start Lesson <ArrowRight size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <button 
              onClick={() => setSelectedLesson(null)}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-display font-bold hover:text-brand-green transition-colors"
            >
              <ArrowLeft size={20} /> Back to Hub
            </button>

            <div className="premium-card bg-white dark:bg-slate-900 overflow-hidden">
              <div className="h-80 relative">
                <img src={selectedLesson.image} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <button className="w-20 h-20 bg-brand-green text-white rounded-full flex items-center justify-center shadow-2xl shadow-brand-green/40 hover:scale-110 transition-transform">
                     <Play size={32} fill="currentColor" className="ml-1" />
                   </button>
                </div>
              </div>
              
              <div className="p-12 -mt-12 relative bg-white dark:bg-slate-900 rounded-t-[3rem]">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[10px] font-display font-bold text-brand-green bg-brand-green/5 dark:bg-brand-green/10 px-4 py-1.5 rounded-full uppercase tracking-widest border border-brand-green/10">
                    {selectedLesson.category}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-500 font-bold">128 Learners enrolled</span>
                </div>
                <h2 className="text-4xl font-display font-bold text-slate-800 dark:text-white mb-8 tracking-tight">{selectedLesson.title}</h2>
                <div className="prose prose-slate dark:prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-strong:text-brand-green">
                  {selectedLesson.content?.split('\n').map((para, i) => (
                    <p key={i} className="mb-6">{para}</p>
                  ))}
                </div>
                
                <div className="mt-12 pt-12 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                      <Star size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-display font-bold text-slate-800 dark:text-slate-200">Rate this lesson</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">Help us improve the curriculum</p>
                    </div>
                  </div>
                  <button className="glow-button px-10 py-4">
                    Complete & Next
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
