import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const root = process.cwd();
// Klasör yolunu src dışına, ana dizine göre ayarlıyoruz
const contentDir = path.join(root, 'content/blog');

export interface BlogPost {
    slug: string;
    meta: {
        title: string;
        date: string;
        description: string;
        readTime: number;
        tags: string[];
        project?: string; // car-price, food-env vs.
    };
    content: string;
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
    if (!fs.existsSync(dirPath)) return [];

    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, arrayOfFiles);
        } else {
            if (path.extname(file) === '.mdx') {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

export function getBlogPosts(): BlogPost[] {
    const filePaths = getAllFiles(contentDir);

    const posts = filePaths.map((filePath) => {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(fileContent);
        const fileName = path.basename(filePath, '.mdx');

        return {
            slug: fileName,
            meta: data as BlogPost['meta'],
            content,
        };
    });

    return posts.sort((a, b) => (new Date(a.meta.date) > new Date(b.meta.date) ? -1 : 1));
}

// Belirli bir slug'a sahip yazıyı bulur (Klasör fark etmeksizin)
export function getPostBySlug(slug: string): BlogPost | null {
    const filePaths = getAllFiles(contentDir);

    const foundPath = filePaths.find((filePath) => {
        const fileName = path.basename(filePath, '.mdx');
        return fileName === slug;
    });

    if (!foundPath) return null;

    const fileContent = fs.readFileSync(foundPath, 'utf-8');
    const { data, content } = matter(fileContent);

    return {
        slug: slug,
        meta: data as BlogPost['meta'],
        content: content
    };
}

// Sadece belirli projenin yazılarını getirir
export function getPostsByProject(projectId: string) {
    const allPosts = getBlogPosts();
    return allPosts.filter((post) => post.meta.project === projectId);
}