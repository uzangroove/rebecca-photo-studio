// אייקון נושאי בקו דק. `fill` הוא נתיב אופציונלי שנצבע מלא (למשל חצי העיגול במונוכרום).
export function Icon({d, fill, size = 24, strokeWidth = 1.6, flip}: {d: string; fill?: string; size?: number; strokeWidth?: number; flip?: boolean}) {
  return <svg viewBox="0 0 24 24" width={size} height={size} style={flip ? {transform: "rotate(180deg)"} : undefined} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d}/>{fill && <path d={fill} fill="currentColor" stroke="none"/>}
  </svg>;
}
export const icons = {
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  download: "M12 4v11 M7 10l5 5 5-5 M5 20h14",
  upload: "M12 16V5 M7 9l5-5 5 5 M5 20h14",
  cloud: "M7 18h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.2 9.1 4.5 4.5 0 0 0 7 18z M9.5 13.5l2 2 3.5-4",
  cloudOff: "M7 18h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.2 9.1 4.5 4.5 0 0 0 7 18z M9.5 11.5l5 5 M14.5 11.5l-5 5",
  compare: "M9 7l-5 5 5 5 M15 7l5 5-5 5",
  shield: "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z M9 9l6 6 M15 9l-6 6",
  plus: "M12 5v14 M5 12h14",
  close: "M6 6l12 12 M18 6L6 18",
  trash: "M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6",
  thumb: "M3 10h4v10H3z M7 10l3.5-6.5a2 2 0 0 1 3.5 1.5L13 9h5.5a2 2 0 0 1 2 2.4l-1.2 6A3 3 0 0 1 16.4 20H7",
  grid: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z",
  reset: "M4 12a8 8 0 1 0 3-6.2 M4 4v4h4",
  recipe: "M5 4h10l4 4v12H5z M15 4v4h4 M8 12h8 M8 16h5"
};
