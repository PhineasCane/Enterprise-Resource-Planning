// src/components/Layout/CustomTitlebar.jsx
export default function CustomTitlebar() {
  return (
    <div
      className="h-9 flex items-center bg-green-700 text-white px-3 select-none"
      style={{ WebkitAppRegion: "drag" }}
    >
      <span className="font-semibold">African Garden ERP</span>
      <div
        className="ml-auto flex items-center gap-3"
        style={{ WebkitAppRegion: "no-drag" }}
      >
        {/* These buttons will call Electron via preload.js IPC */}
        <button onClick={() => window.electronAPI.minimize()}>—</button>
        <button onClick={() => window.electronAPI.maximizeRestore()}>⬜</button>
        <button onClick={() => window.electronAPI.close()}>✕</button>
      </div>
    </div>
  );
}
