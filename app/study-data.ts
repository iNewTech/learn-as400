import raw from '@/content/chapters.json';
import commonRaw from '@/content/common-issues.json';
import codingRaw from '@/content/coding-exercises.json';
import lessonRaw from '@/content/lessons.json';

export const chapters = [...raw, commonRaw, codingRaw];
export const lessons = lessonRaw;
