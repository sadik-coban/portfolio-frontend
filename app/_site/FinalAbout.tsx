"use client";

import { useState } from 'react';
import { useLang } from './i18n';
import PaperShell from './PaperShell';

const CHANNELS = [
    { label: 'Email', value: 's.c_2004@hotmail.com', href: 'mailto:s.c_2004@hotmail.com' },
    { label: 'GitHub', value: 'github.com/sadik-coban', href: 'https://github.com/sadik-coban' },
    { label: 'LinkedIn', value: 'in/sadık-çoban', href: 'https://www.linkedin.com/in/sad%C4%B1k-%C3%A7oban-5239aa253' },
];

const SUBJECTS = ['about.subjJob', 'about.subjCollab', 'about.subjConsult', 'about.subjHi'];

export default function FinalAbout() {
    const { t } = useLang();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState(0);
    const [message, setMessage] = useState('');

    const send = () => {
        const subj = encodeURIComponent(t(SUBJECTS[subject]));
        const body = encodeURIComponent(`${message}\n\n— ${name}${email ? ` (${email})` : ''}`);
        window.location.href = `mailto:s.c_2004@hotmail.com?subject=${subj}&body=${body}`;
    };

    return (
        <PaperShell>
            {/* bio */}
            <div className="py-14 lg:py-[72px] lg:pb-14">
                <div className="max-w-[640px]">
                    <div className="mb-6 font-mono text-[12px] uppercase tracking-[0.16em] text-[#047857]">{t('about.eyebrow')}</div>
                    <h1 className="m-0 mb-6 text-[40px] md:text-[44px] font-bold leading-[1.08] tracking-[-0.045em] text-[#1a1a1a]">{t('about.title')}</h1>
                    <p className="m-0 mb-[18px] text-[17px] leading-[1.65] text-[#5f5f5a]">{t('about.p1')}</p>
                    <p className="m-0 text-[17px] leading-[1.65] text-[#5f5f5a]">{t('about.p2')}</p>
                </div>
            </div>

            {/* contact */}
            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-14 border-t border-[#e9e7e2] py-14">
                <div>
                    <h2 className="m-0 mb-4 font-mono text-[13px] uppercase tracking-[0.16em] text-[#5f5f5a]">{t('about.contactTitle')}</h2>
                    <p className="m-0 mb-7 max-w-[380px] text-[17px] leading-[1.6] text-[#5f5f5a]">{t('about.contactLead')}</p>
                    {CHANNELS.map((c) => (
                        <a key={c.label} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center justify-between gap-4 border-t border-[#e9e7e2] py-4 group">
                            <span className="font-mono text-[12px] uppercase tracking-[0.04em] text-[#86857e]">{c.label}</span>
                            <span className="text-[15px] font-medium text-[#1a1a1a] group-hover:text-[#047857] transition-colors">{c.value} ↗</span>
                        </a>
                    ))}
                    <div className="border-t border-[#e9e7e2]" />
                </div>

                {/* form */}
                <div className="rounded-[14px] border border-[#e4e2dd] bg-[#fdfcf9] p-6 sm:p-8 shadow-[0_1px_3px_rgba(40,40,30,0.05)]">
                    <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label={t('about.formName')} placeholder={t('about.formNamePh')} value={name} onChange={setName} />
                        <Field label={t('about.formEmail')} placeholder={t('about.formEmailPh')} value={email} onChange={setEmail} mono />
                    </div>
                    <div className="mb-4">
                        <FieldLabel>{t('about.formSubject')}</FieldLabel>
                        <div className="flex flex-wrap gap-2">
                            {SUBJECTS.map((s, i) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setSubject(i)}
                                    className={`cursor-pointer rounded-[20px] border px-3.5 py-[7px] font-mono text-[12px] transition-colors ${i === subject ? 'border-[#1a1a1a] bg-[#1a1a1a] text-[#f7f6f3]' : 'border-[#d8d6d0] bg-[#f7f6f3] text-[#5f5f5a] hover:border-[#86857e]'}`}
                                >
                                    {t(s)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mb-5">
                        <FieldLabel>{t('about.formMessage')}</FieldLabel>
                        <textarea
                            rows={4}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={t('about.formMessagePh')}
                            className="w-full resize-none rounded-[9px] border border-[#d8d6d0] bg-[#f7f6f3] p-3.5 text-[14px] leading-[1.55] text-[#1a1a1a] outline-none placeholder:text-[#9a9a92] focus:border-[#047857]"
                        />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <span className="font-mono text-[12px] text-[#86857e]">{t('about.formNote')}</span>
                        <button onClick={send} className="inline-flex h-[44px] shrink-0 items-center rounded-[10px] bg-[#1a1a1a] px-[26px] text-[14px] font-semibold text-[#f7f6f3] transition-opacity hover:opacity-90">{t('about.formSend')} →</button>
                    </div>
                </div>
            </div>
        </PaperShell>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.05em] text-[#86857e]">{children}</div>;
}

function Field({ label, placeholder, value, onChange, mono }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; mono?: boolean }) {
    return (
        <div>
            <FieldLabel>{label}</FieldLabel>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`h-[44px] w-full rounded-[9px] border border-[#d8d6d0] bg-[#f7f6f3] px-3.5 text-[14px] text-[#1a1a1a] outline-none placeholder:text-[#9a9a92] focus:border-[#047857] ${mono ? 'font-mono' : ''}`}
            />
        </div>
    );
}
