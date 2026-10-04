// אייקון נושאי בקו דק. `fill` הוא נתיב אופציונלי שנצבע מלא (למשל חצי העיגול במונוכרום).
export function Icon({d, fill, size = 24, strokeWidth = 1.6}: {d: string; fill?: string; size?: number; strokeWidth?: number}) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d}/>{fill && <path d={fill} fill="currentColor" stroke="none"/>}
  </svg>;
}
export const icons = {
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  download: "M12 4v11 M7 10l5 5 5-5 M5 20h14",
  upload: "M12 16V5 M7 9l5-5 5 5 M5 20h14",
  cloud: "M7 18h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.2 9.1 4.5 4.5 0 0 0 7 18z M9.5 13.5l2 2 3.5-4",
  cloudOff: "M7 18h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.2 9.1 4.5 4.5 0 0 0 7 18z M9.5 11.5l5 5 M14.5 11.5l-5 5",
  compare: "M9 7l-5 5 5 5 M15 7l5 5-5 5"
};
