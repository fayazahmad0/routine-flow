/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useRoutine } from '../../context/RoutineContext';
import { MoodType } from '../../types';
import { Smile, Meh, Frown, Sparkles, Check, Edit3 } from 'lucide-react';

const MOODS: { id: MoodType; label: string; icon: string; emoji: string }[] = [
  { id: 'great', label: 'Great', icon: 'Smile', emoji: '😄' },
  { id: 'good', label: 'Good', icon: 'Smile', emoji: '🙂' },
  { id: 'okay', label: 'Okay', icon: 'Meh', emoji: '😐' },
  { id: 'bad', label: 'Rough', icon: 'Frown', emoji: '😔' },
];

export const DailyReflectionCard: React.FC = React.memo(() => {
  const { todayDateStr, dailyRecords, saveDailyRecord } = useRoutine();
  
  const currentRecord = dailyRecords.find((r) => r.localDate === todayDateStr);
  const [mood, setMood] = useState<MoodType>(currentRecord?.mood || 'none');
  const [note, setNote] = useState<string>(currentRecord?.note || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    if (currentRecord) {
      setMood(currentRecord.mood || 'none');
      setNote(currentRecord.note || '');
    }
  }, [currentRecord]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveDailyRecord(todayDateStr, note, mood);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error('Error saving daily record:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoodSelect = async (m: MoodType) => {
    setMood(m);
    await saveDailyRecord(todayDateStr, note, m);
  };

  return (
    <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-5 border border-[#E8E3DA] dark:border-[#282725] shadow-xs transition-all space-y-3.5">
      <div className="flex items-center justify-between pb-2 border-b border-[#E8E3DA] dark:border-[#282725]">
        <h3 className="font-serif text-sm font-bold text-[#1A1A1A] dark:text-[#F3EFEA] tracking-tight flex items-center gap-1.5">
          <Edit3 className="w-4 h-4 text-[#78716C] dark:text-[#A39E96]" />
          Evening Journal
        </h3>
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] dark:text-[#A39E96]">
          Daily State
        </span>
      </div>

      {/* Mood Selector */}
      <div className="grid grid-cols-4 gap-2">
        {MOODS.map((m) => {
          const isSelected = mood === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => handleMoodSelect(m.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#1A1A1A] dark:border-[#F3EFEA] bg-[#F2EDE4] dark:bg-[#252422] text-[#1A1A1A] dark:text-[#F3EFEA] ring-1 ring-[#1A1A1A] dark:ring-[#F3EFEA]'
                  : 'border-[#E8E3DA] dark:border-[#282725] bg-white dark:bg-[#1A1918] hover:bg-[#F2EDE4] dark:hover:bg-[#22211F] text-[#57534E] dark:text-[#A39E96]'
              }`}
            >
              <span className="text-lg">{m.emoji}</span>
              <span className="text-[10px] font-mono uppercase tracking-tight mt-1">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Reflection Note */}
      <div>
        <textarea
          rows={2}
          placeholder="Record a thought, insight, or gratitude from the day..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full p-3 bg-[#FAF8F5] dark:bg-[#161616] border border-[#E8E3DA] dark:border-[#33302D] rounded-xl text-xs font-medium text-[#1A1A1A] dark:text-[#F3EFEA] placeholder-[#78716C] dark:placeholder-[#8C8780] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#F3EFEA] resize-none transition-all"
        />
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1A1A1A] hover:bg-[#33312E] dark:bg-[#F3EFEA] dark:text-[#121212] text-[#FAF8F5] text-xs font-mono font-bold uppercase tracking-wider rounded-lg shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Recorded</span>
              </>
            ) : isSaving ? (
              'Saving...'
            ) : (
              'Save Entry'
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

DailyReflectionCard.displayName = 'DailyReflectionCard';
