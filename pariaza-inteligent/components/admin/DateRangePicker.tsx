'use client';

import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { subDays } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';

export type DateRangePreset = '7d' | '30d' | 'all' | 'custom';

interface DateRangePickerProps {
    onRangeChange: (startDate: Date | null, endDate: Date | null, preset: DateRangePreset) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ onRangeChange }) => {
    const [preset, setPreset] = useState<DateRangePreset>('all');
    const [customStart, setCustomStart] = useState<Date | null>(null);
    const [customEnd, setCustomEnd] = useState<Date | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);

    const handlePresetClick = (selectedPreset: DateRangePreset) => {
        setPreset(selectedPreset);
        setShowCalendar(false);

        const now = new Date();
        let start: Date | null = null;
        let end: Date | null = null;

        switch (selectedPreset) {
            case '7d':
                start = subDays(now, 7);
                end = now;
                break;
            case '30d':
                start = subDays(now, 30);
                end = now;
                break;
            case 'all':
                start = null;
                end = null;
                break;
        }

        onRangeChange(start, end, selectedPreset);
    };

    const handleCustomRangeChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;
        setCustomStart(start);
        setCustomEnd(end);

        if (start && end) {
            setPreset('custom');
            onRangeChange(start, end, 'custom');
            setShowCalendar(false);
        }
    };

    return (
        <div className="mb-6">
            {/* Preset Buttons */}
            <div className="flex flex-wrap gap-3 mb-4">
                <button
                    onClick={() => handlePresetClick('7d')}
                    className={`px-4 py-2.5 rounded-2xl font-black text-sm border-3 transition-all ${preset === '7d'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-600 shadow-lg scale-105'
                        : 'bg-white text-purple-700 border-purple-300 hover:border-purple-400 hover:shadow-md'
                        }`}
                >
                    📅 Ultimele 7 zile
                </button>

                <button
                    onClick={() => handlePresetClick('30d')}
                    className={`px-4 py-2.5 rounded-2xl font-black text-sm border-3 transition-all ${preset === '30d'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-600 shadow-lg scale-105'
                        : 'bg-white text-purple-700 border-purple-300 hover:border-purple-400 hover:shadow-md'
                        }`}
                >
                    📊 Ultimele 30 zile
                </button>

                <button
                    onClick={() => handlePresetClick('all')}
                    className={`px-4 py-2.5 rounded-2xl font-black text-sm border-3 transition-all ${preset === 'all'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-600 shadow-lg scale-105'
                        : 'bg-white text-purple-700 border-purple-300 hover:border-purple-400 hover:shadow-md'
                        }`}
                >
                    🌟 Tot istoricul
                </button>

                <button
                    onClick={() => {
                        setShowCalendar(!showCalendar);
                        if (!showCalendar) setPreset('custom');
                    }}
                    className={`px-4 py-2.5 rounded-2xl font-black text-sm border-3 transition-all flex items-center gap-2 ${preset === 'custom'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-600 shadow-lg scale-105'
                        : 'bg-white text-purple-700 border-purple-300 hover:border-purple-400 hover:shadow-md'
                        }`}
                >
                    <Calendar className="w-4 h-4" />
                    🗓️ Perioadă personalizată
                </button>
            </div>

            {/* Custom Date Range Picker */}
            {showCalendar && (
                <div className="bg-white rounded-2xl p-6 border-4 border-purple-300 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-sm font-bold text-purple-700 mb-3">
                        Selectează perioada:
                    </div>
                    <DatePicker
                        selected={customStart}
                        onChange={handleCustomRangeChange}
                        startDate={customStart}
                        endDate={customEnd}
                        selectsRange
                        inline
                        monthsShown={2}
                        className="duolingo-datepicker"
                    />
                    {customStart && customEnd && (
                        <div className="mt-4 p-3 bg-purple-50 rounded-xl border-2 border-purple-200">
                            <div className="text-xs font-bold text-purple-700 mb-1">
                                Perioada selectată:
                            </div>
                            <div className="text-sm font-black text-purple-800">
                                {customStart.toLocaleDateString('ro-RO')} - {customEnd.toLocaleDateString('ro-RO')}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Inject custom CSS for datepicker */}
            <style jsx global>{`
                .duolingo-datepicker {
                    font-family: inherit;
                }
                .react-datepicker {
                    border: 4px solid rgb(216 180 254);
                    border-radius: 1rem;
                    font-family: inherit;
                }
                .react-datepicker__header {
                    background: linear-gradient(to right, rgb(168 85 247), rgb(236 72 153));
                    border-bottom: 3px solid rgb(192 132 252);
                    border-radius: 0.75rem 0.75rem 0 0;
                }
                .react-datepicker__current-month,
                .react-datepicker__day-name {
                    color: white;
                    font-weight: 900;
                }
                .react-datepicker__day:hover {
                    background-color: rgb(233 213 255);
                    border-radius: 0.5rem;
                }
                .react-datepicker__day--selected,
                .react-datepicker__day--in-range {
                    background: linear-gradient(to right, rgb(168 85 247), rgb(236 72 153));
                    color: white;
                    border-radius: 0.5rem;
                    font-weight: 900;
                }
                .react-datepicker__day--keyboard-selected {
                    background-color: rgb(216 180 254);
                    border-radius: 0.5rem;
                }
            `}</style>
        </div>
    );
};
