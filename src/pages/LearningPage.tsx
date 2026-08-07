import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ArrowRight, ArrowLeft, Play, Clock, Star, GraduationCap } from 'lucide-react';
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
      className="max-w-6xl mx-auto space-y-10"
    >
      <AnimatePresence mode="wait">
        {!selectedLesson ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-10"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-green/5 dark:bg-brand-green/10 border border-brand-green/10 text-brand-green text-xs font-display font-bold uppercase tracking-widest mb-4">
                  <GraduationCap size={12} /> Curated Guides
                </div>
                <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Learning Hub</h2>
                <p className="text-base text-slate-500 dark:text-slate-400 mt-1">Master the Nigerian financial landscape.</p>
              </div>
              <div className="hidden md:flex items-center gap-4 pb-1">
                <div className="text-right">
                  <p className="text-sm font-display font-bold text-slate-800 dark:text-slate-200">Your Progress</p>
                  <p className="text-xs font-bold text-brand-green">4/12 Lessons</p>
                </div>
                <div className="relative w-14 h-14">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" strokeWidth="4" className="stroke-slate-100 dark:stroke-slate-800" />
                    <circle cx="28" cy="28" r="24" fill="none" strokeWidth="4" strokeLinecap="round" className="stroke-brand-green" strokeDasharray={`${2 * Math.PI * 24 * 0.33} ${2 * Math.PI * 24}`} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-display font-bold text-slate-800 dark:text-white">33%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingLearn ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="h-48 bg-slate-100 dark:bg-slate-800 shimmer" />
                    <div className="p-7 space-y-3">
                      <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-lg w-3/4 shimmer" />
                      <div className="h-4 bg-slate-50 dark:bg-slate-800/50 rounded w-full shimmer" />
                      <div className="h-4 bg-slate-50 dark:bg-slate-800/50 rounded w-2/3 shimmer" />
                    </div>
                  </div>
                ))
              ) : learningContent.length > 0 ? learningContent.map((lesson, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  onClick={() => setSelectedLesson(lesson)}
                  className="group cursor-pointer rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 overflow-hidden hover:border-brand-green/20 dark:hover:border-brand-green/20 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img src={lesson.image} alt={lesson.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-900 dark:text-white text-[10px] font-display font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                      {lesson.category}
                    </span>
                    <div className="absolute bottom-3 left-3 flex items-center gap-3 text-white">
                      <div className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest">
                        <Clock size={11} /> 15m
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest">
                        <Star size={11} className="text-brand-gold" /> 4.9
                      </div>
                    </div>
                  </div>
                  <div className="p-7">
                    <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-green transition-colors leading-snug">{lesson.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-5 leading-relaxed">{lesson.description}</p>
                    <span className="flex items-center gap-2 text-xs font-display font-bold text-brand-green group-hover:gap-3 transition-all uppercase tracking-widest">
                      Start Lesson <ArrowRight size={14} />
                    </span>
                  </div>
                </motion.div>
              )) : (
                <div className="col-span-full text-center py-20">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-6">
                    <BookOpen size={36} className="text-slate-300 dark:text-slate-600 -rotate-6" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-slate-500 dark:text-slate-400 mb-2">Lessons loading soon</h3>
                  <p className="text-sm text-slate-400 dark:text-slate-500">Curated financial education content is on its way.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <button
              onClick={() => setSelectedLesson(null)}
              className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-display font-bold hover:text-brand-green transition-colors"
            >
              <ArrowLeft size={18} /> Back to Hub
            </button>

            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none">
              <div className="h-72 md:h-80 relative">
                <img src={selectedLesson.image} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="w-16 h-16 bg-brand-green text-white rounded-full flex items-center justify-center shadow-2xl shadow-brand-green/40 hover:scale-110 transition-transform">
                    <Play size={28} fill="currentColor" className="ml-1" />
                  </button>
                </div>
              </div>

              <div className="p-8 md:p-12 -mt-10 relative bg-white dark:bg-slate-900 rounded-t-3xl">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-[10px] font-display font-bold text-brand-green bg-brand-green/5 dark:bg-brand-green/10 px-4 py-1.5 rounded-full uppercase tracking-widest border border-brand-green/10">
                    {selectedLesson.category}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">128 Learners</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-800 dark:text-white mb-8 tracking-tight">{selectedLesson.title}</h2>
                <div className="prose prose-slate dark:prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-strong:text-brand-green">
                  {selectedLesson.content?.split('\n').map((para, i) => (
                    <p key={i} className="mb-5">{para}</p>
                  ))}
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                      <Star size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-display font-bold text-slate-800 dark:text-slate-200">Rate this lesson</p>
                      <p className="text-xs text-slate-500">Help improve the curriculum</p>
                    </div>
                  </div>
                  <button className="glow-button px-8 py-3.5 w-full sm:w-auto">
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
