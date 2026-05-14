"use client";

import { useEffect, useMemo, useState } from "react";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DatePickerField({
  label,
  value,
  placeholder = "Select date",
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => monthFromValue(value));
  const days = useMemo(() => calendarDays(visibleMonth), [visibleMonth]);
  const selectedDate = parseDateValue(value);

  useEffect(() => {
    const date = parseDateValue(value);
    if (date) {
      setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [value]);

  function selectDate(date: Date) {
    onChange(toDateValue(date));
    setOpen(false);
  }

  return (
    <div className="relative grid gap-2 text-sm font-semibold text-[#18352f]">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 items-center justify-between rounded-xl border border-[#d8cebb] bg-white px-3 text-left text-sm font-medium text-[#52615a] outline-none focus:border-[#18352f]"
      >
        <span>{formatDateLabel(value) || placeholder}</span>
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#72815e]">Date</span>
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-20 mt-2 w-full min-w-[280px] rounded-2xl border border-[#e8dfd0] bg-white p-4 shadow-[0_24px_70px_rgba(54,43,29,0.16)]">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))} className="h-9 w-9 rounded-full bg-[#fbfaf7] text-sm font-semibold text-[#18352f] ring-1 ring-[#eadfce]">
              {"<"}
            </button>
            <p className="text-sm font-semibold text-[#18352f]">
              {monthNames[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
            </p>
            <button type="button" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))} className="h-9 w-9 rounded-full bg-[#fbfaf7] text-sm font-semibold text-[#18352f] ring-1 ring-[#eadfce]">
              {">"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center">
            {dayNames.map((day) => (
              <span key={day} className="py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b958f]">
                {day}
              </span>
            ))}
            {days.map((day) => {
              const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

              return (
                <button
                  key={toDateValue(day)}
                  type="button"
                  onClick={() => selectDate(day)}
                  className={`h-9 rounded-full text-sm font-semibold transition ${
                    isSelected
                      ? "bg-[#18352f] text-white"
                      : isCurrentMonth
                        ? "text-[#18352f] hover:bg-[#edf0ea]"
                        : "text-[#b0b8b2] hover:bg-[#fbfaf7]"
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#eadfce] pt-3">
            <button type="button" onClick={() => setVisibleMonth(new Date())} className="rounded-full bg-[#fbfaf7] px-3 py-2 text-xs font-semibold text-[#18352f] ring-1 ring-[#eadfce]">
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#9d3323] ring-1 ring-[#eadfce]"
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function formatDateLabel(value: string) {
  const date = parseDateValue(value);
  if (!date) {
    return value;
  }

  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function monthFromValue(value: string) {
  const date = parseDateValue(value);
  const base = date ?? new Date();
  return new Date(base.getFullYear(), base.getMonth(), 1);
}

function calendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function parseDateValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }

  return date;
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
