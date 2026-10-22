export interface Reminder {
    title: string;
    time: string; // HH:MM, local
    description: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

const stamp = (d: Date, time: string, plusMinutes = 0) => {
    const [h, m] = time.split(':').map(Number);
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m + plusMinutes);
    return `${t.getFullYear()}${pad(t.getMonth() + 1)}${pad(t.getDate())}T${pad(t.getHours())}${pad(t.getMinutes())}00`;
};

const escapeText = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

/** Fold content lines at 75 octets (RFC 5545 §3.1) without splitting a UTF-8 character. */
const fold = (line: string) => {
    const enc = new TextEncoder();
    const parts: string[] = [];
    let current = '';
    let bytes = 0;
    for (const ch of line) {
        const n = enc.encode(ch).length;
        if (bytes + n > (parts.length ? 74 : 75)) {
            parts.push(current);
            current = '';
            bytes = 0;
        }
        current += ch;
        bytes += n;
    }
    parts.push(current);
    return parts.join('\r\n ');
};

/** RFC 5545 calendar with one daily recurring event (floating local time) per reminder. */
export const buildIcs = (reminders: Reminder[], url: string, now = new Date()) => {
    const dtstamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const events = reminders.flatMap((r, i) => [
        'BEGIN:VEVENT',
        `UID:chronos-${i}-${r.time.replace(':', '')}-${now.getTime()}@chronos`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${stamp(now, r.time)}`,
        `DTEND:${stamp(now, r.time, 10)}`,
        'RRULE:FREQ=DAILY',
        `SUMMARY:${escapeText(r.title)}`,
        `DESCRIPTION:${escapeText(`${r.description}\n${url}`)}`,
        `URL:${url}`,
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeText(r.title)}`,
        'TRIGGER:PT0M',
        'END:VALARM',
        'END:VEVENT',
    ]);
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Chronos//Reminders//EN', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR']
        .map(fold).join('\r\n') + '\r\n';
};

export const googleCalendarUrl = (r: Reminder, url: string, now = new Date()) => {
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: r.title,
        details: `${r.description}\n${url}`,
        dates: `${stamp(now, r.time)}/${stamp(now, r.time, 10)}`,
        recur: 'RRULE:FREQ=DAILY',
    });
    return `https://calendar.google.com/calendar/render?${params}`;
};

export const downloadFile = (name: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
