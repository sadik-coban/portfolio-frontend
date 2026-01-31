import { getPostBySlug, getBlogPosts } from '@/lib/mdx';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { notFound } from 'next/navigation';
import rehypePrettyCode from 'rehype-pretty-code';

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
    const posts = getBlogPosts();
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export default async function BlogPost(props: Props) {
    const params = await props.params;
    const { slug } = params;

    const cleanSlug = decodeURIComponent(slug);
    const post = getPostBySlug(cleanSlug);

    if (!post) {
        return notFound();
    }

    const backLink = post.meta.project
        ? `/projects/${post.meta.project}/blog`
        : '/blog';

    const backLabel = post.meta.project
        ? 'Back to Project Journal'
        : 'Back to All Posts';

    // --- 1. GARANTİ ÇALIŞAN TEMA AYARI ---
    const mdxOptions: any = {
        rehypePlugins: [
            [
                rehypePrettyCode,
                {
                    // Şimdilik tek tema kullanalım (En güvenli yöntem)
                    theme: 'one-dark-pro',
                    // Arka planı CSS ile biz vereceğiz, o yüzden false
                    keepBackground: false,
                    defaultLang: 'plaintext',
                },
            ],
        ],
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans overflow-x-hidden">
            <Navbar />

            <article className="max-w-3xl mx-auto py-32 px-6 animate-in fade-in duration-700">

                {/* --- NAVIGATION --- */}
                <div className="flex flex-wrap items-center gap-6 mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <Link
                        href={backLink}
                        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
                    >
                        <ArrowLeft size={16} className="mr-2" /> {backLabel}
                    </Link>

                    {post.meta.project && (
                        <>
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            <Link
                                href="/blog"
                                className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-purple-600 transition-colors"
                            >
                                <BookOpen size={16} className="mr-2" /> Blog Home
                            </Link>
                        </>
                    )}
                </div>

                <header className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                        {post.meta.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 text-slate-500 text-sm font-medium border-b border-slate-200 dark:border-slate-800 pb-8">
                        <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-600 dark:text-slate-300">
                            {post.meta.date}
                        </span>

                        {post.meta.tags && (
                            <div className="flex gap-2 ml-auto">
                                {post.meta.tags.map(tag => (
                                    <span key={tag} className="text-blue-600 dark:text-blue-400">#{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </header>

                {/* --- 3. STİL AYARLARI (COLORS FIX) --- */}
                <div className="
                    prose prose-lg dark:prose-invert prose-slate max-w-none
                    
                    /* Link ve Resim Stilleri */
                    prose-headings:font-bold prose-a:text-blue-600 hover:prose-a:underline
                    prose-img:rounded-2xl prose-img:shadow-lg
                    
                    /* --- KOD BLOĞU (PRE) --- */
                    /* Genişlik ve Scroll */
                    [&_pre]:w-[calc(100vw-3rem)] md:[&_pre]:w-full
                    [&_pre]:overflow-x-auto
                    
                    /* Görünüm */
                    [&_pre]:bg-[#282c34] /* One Dark Pro Arka Planı (Sabit) */
                    [&_pre]:text-gray-100 /* Varsayılan metin rengi (Renklendirme olmazsa) */
                    [&_pre]:p-5
                    [&_pre]:my-8
                    [&_pre]:rounded-xl
                    [&_pre]:border [&_pre]:border-slate-800
                    
                    /* --- KOD İÇERİĞİ (CODE) --- */
                    /* Tailwind'in prose eklentisinin backtick (`) eklemesini engelle */
                    [&_pre_code]:before:content-none 
                    [&_pre_code]:after:content-none
                    
                    /* Arka planı temizle ve fontu ayarla */
                    [&_pre_code]:bg-transparent
                    [&_pre_code]:p-0
                    [&_pre_code]:text-sm md:[&_pre_code]:text-base
                    [&_pre_code]:font-mono
                    
                    /* --- SATIR İÇİ KOD (INLINE) --- */
                    /* Paragraf içindeki `kod` parçaları */
                    [&_:not(pre)>code]:bg-slate-200 dark:[&_:not(pre)>code]:bg-slate-800
                    [&_:not(pre)>code]:text-pink-600 dark:[&_:not(pre)>code]:text-pink-400
                    [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5
                    [&_:not(pre)>code]:rounded-md
                    [&_:not(pre)>code]:font-mono
                    [&_:not(pre)>code]:before:content-[''] 
                    [&_:not(pre)>code]:after:content-['']
                    ">

                    <MDXRemote
                        source={post.content}
                        options={{ mdxOptions }}
                    />
                </div>
            </article>
        </div>
    );
}