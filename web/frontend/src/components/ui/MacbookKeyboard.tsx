 
const UNIT = 64;
const GAP = 8;
const keyWidth = (units:number) => units * UNIT + (units - 1) * GAP;

const ShiftArrow = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
    <path d="M12 3 L21 14 H15 V21 H9 V14 H3 Z" fill="#a9a9ae" />
  </svg>
);

const Key = ({ def }:any) => {
  const { w, variant, top, bottom, main } = def;
  const style = { width: keyWidth(w), height: UNIT };

  const base =
    "relative select-none rounded-[9px] border-[1.2px] border-[#4041438c] text-[#787878] bg-gradient-to-t from-[#fbfbfc] to-[#e9e9ec8c] " +
    "shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_-1.5px_0_rgba(0,0,0,0.06)_inset,0_1px_2px_rgba(0,0,0,0.15),0_-1px_0px_#4041438c] " +
    "text-[#3c3c41] flex-shrink-0";

  return (
    <div className={`${base} ${def.className ?? ""}`} style={style}>
      {variant === "center" && (
        <div className="w-full h-full  flex items-center justify-center   text-[17px] font-normal">
          {main}
        </div>
      )}

      {variant === "corner" && (
        <div className="w-full h-full flex flex-col justify-between  items-start px-2.5 py-1.5">
          <span className="text-[13px] leading-none">{top}</span>
          <span className="text-[17px] leading-none">{bottom}</span>
        </div>
      )}

      {variant === "label-bl" && (
        <div className="w-full h-full flex items-  flex-col justify-between px-2.5 py-1.5">
          <span className="text-[13px] leading-none">{top}</span>
          <span className="text-[13px] leading-none">{bottom}</span>
        </div>
      )}

      {variant === "label-br" && (
        <div className="w-full h-full flex items-end justify-end  px-2.5 pb-1.5">
          <span className="text-[13px] leading-none">{bottom}</span>
        </div>
      )}

      {variant === "capslock" && (
        <div className="w-full h-full flex flex-col justify-between items-start px-2.5 py-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#a9a9ae]" />
          <span className="text-[13px] leading-none">CapsLock</span>
        </div>
      )}

      {variant === "shift-left" && (
        <div className="w-full h-full flex flex-col justify-end  px-2.5 py-2">
          <span className="text-[13px] leading-none">shift</span>
        </div>
      )}

      {variant === "shift-right" && (
        <div className="w-full h-full flex flex-col justify-end items-end  px-2.5 py-2">
          <span className="text-[13px] leading-none">shift</span>
        </div>
      )}

      {variant === "enter" && (
        <div className="w-full h-full flex flex-col  justify-end items-end px-2.5 py-1.5">
           <span className="text-[13px] leading-none">return</span>
        </div>
      )}

      {variant === "altcmd" && (
        <div className="w-full h-full flex flex-col justify-between items-start px-2.5 py-1.5">
          <span className="text-[13px] leading-none">{top}</span>
          <span className="text-[13px] leading-none">{bottom}</span>
        </div>
      )}

      {variant === "touchid" && (
        <div className="w-full h-full flex items-center justify-center  ">
          <span className="w-11 h-11 rounded-full border-[1.5px] border-[#b5b5ba] bg-[#E5E9F2] " />
        </div>
      )}

      {variant === "arrows" && (
        <div className="w-full h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center border-b border-[#d7d7da] text-[11px]">
            ▲
          </div>
          <div className="flex-1 flex items-center justify-center text-[11px]">
            ▼
          </div>
        </div>
      )}
    </div>
  );
};

const Row = ({ children, className }) => (
  <div className={`flex gap-2 ${className ?? ""}`}>{children}</div>
);

const MacKeyboard = () => {
  const fRow = [
    { w: 1.8, variant: "label-bl", bottom: "esc" , className:'rounded-tl-[20px]'},
    ...["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"].map(
      (f) => ({ w: 1, variant: "center", main: f, className: "!text-[13px]" })
    ),
    { w: 1, variant: "touchid" ,className:'rounded-tr-[20px]'},
  ];

  const numRow = [
    { w: 1, variant: "corner", top: "~", bottom: "`" },
    { w: 1, variant: "corner", top: "!", bottom: "1" },
    { w: 1, variant: "corner", top: "@", bottom: "2" },
    { w: 1, variant: "corner", top: "#", bottom: "3" },
    { w: 1, variant: "corner", top: "$", bottom: "4" },
    { w: 1, variant: "corner", top: "%", bottom: "5" },
    { w: 1, variant: "corner", top: "^", bottom: "6" },
    { w: 1, variant: "corner", top: "&", bottom: "7" },
    { w: 1, variant: "corner", top: "*", bottom: "8" },
    { w: 1, variant: "corner", top: "(", bottom: "9" },
    { w: 1, variant: "corner", top: ")", bottom: "0" },
    { w: 1, variant: "corner", top: "_", bottom: "-" },
    { w: 1, variant: "corner", top: "+", bottom: "=" },
    { w: 1.8, variant: "label-br", bottom: "delete" },
  ];

  const tabRow = [
    { w: 1.5, variant: "label-bl", bottom: "tab" },
    ...["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"].map((l) => ({
      w: 1,
      variant: "center",
      main: l,
    })),
    { w: 1, variant: "corner", top: "{", bottom: "[" },
    { w: 1, variant: "corner", top: "}", bottom: "]" },
    { w: 1.3, variant: "corner", top: "|", bottom: "\\" },
  ];

  const capsRow = [
    { w: 1.8, variant: "capslock" },
    ...["A", "S", "D", "F", "G", "H", "J", "K", "L"].map((l) => ({
      w: 1,
      variant: "center",
      main: l,
    })),
    { w: 1, variant: "corner", top: ":", bottom: ";" },
    { w: 1, variant: "corner", top: '"', bottom: "'" },
    { w: 2, variant: "enter" },
  ];

  const shiftRow = [
    { w: 2.3, variant: "shift-left" },
    ...["Z", "X", "C", "V", "B", "N", "M"].map((l) => ({
      w: 1,
      variant: "center",
      main: l,
    })),
    { w: 1, variant: "corner", top: "<", bottom: "," },
    { w: 1, variant: "corner", top: ">", bottom: "." },
    { w: 1, variant: "corner", top: "?", bottom: "/" },
    { w: 2.5, variant: "shift-right" },
  ];

  const bottomRow = [
    { w: 1, variant: "label-bl", top: "fn" ,className:'rounded-bl-[20px]'},
    { w: 1, variant: "label-bl",  top: "^" ,bottom: "control" },
    { w: 1.15, variant: "altcmd", top: "⌥", bottom: "option" },
    { w: 1.3, variant: "label-bl",  top: "⌘",bottom: "command" },
    { w: 5.2, variant: "center", main: "" },
    { w: 1.3, variant: "label-bl", top: "⌘", bottom: "command" },
    { w: 1.15, variant: "altcmd", top: "⌥", bottom: "option" },
    { w: 0.9, variant: "center", main: "◀" },
    { w: 0.9, variant: "arrows" },
    { w: 0.9, variant: "center", main: "▶" ,className:'rounded-br-[20px]'},
  ];

  const rows = [fRow, numRow, tabRow, capsRow, shiftRow, bottomRow];

  return (
    <div className="w-fit drop-shadow-[0_10px_10px_#ffffff57] p-6 max-md:scale-[0.7] max-md:-ml-40 ">
      <div className="rounded-4xl [20px] bg-[#C6C7C8] p-3 flex flex-col gap-2">
        {rows.map((row, ri) => (
          <Row key={ri}>
            {row.map((k, i) => (
              <Key key={i} def={k} />
            ))}
          </Row>
        ))}
      </div>
    </div>
  );
};

export default MacKeyboard;