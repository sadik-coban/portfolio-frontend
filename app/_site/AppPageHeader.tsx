/** App page header — eyebrow + title + optional mono meta (design 2). */
export function AppPageHeader({ eyebrow, title, meta }: { eyebrow: string; title: string; meta?: string }) {
    return (
        <div className="mb-7">
            <div className="mb-2 text-[13px] font-medium text-[#047857]">{eyebrow}</div>
            <h1 className="text-[28px] md:text-[34px] font-bold tracking-[-0.041em] text-[#1a1a1a]">{title}</h1>
            {meta ? <p className="mt-1.5 font-mono text-[14px] text-[#86857e]">{meta}</p> : null}
        </div>
    );
}
