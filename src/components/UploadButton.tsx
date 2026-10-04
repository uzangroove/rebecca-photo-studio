import {Icon, icons} from "./Icon";

export function UploadButton({label, onFile, variant = "pill"}: {label: string; onFile: (file?: File) => void; variant?: "pill" | "primary"}) {
  return <label className={variant === "primary" ? "upload upload-primary" : "upload pill"}>
    <Icon d={icons.upload} size={20}/>{label}
    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => {onFile(e.target.files?.[0]); e.currentTarget.value = "";}}/>
  </label>;
}
