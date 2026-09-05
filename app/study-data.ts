import raw from '@/content/chapters.json';
import codingRaw from '@/content/coding-exercises.json';
import lessonRaw from '@/content/lessons.json';

export const chapters = [...raw, codingRaw];
export const lessons = lessonRaw;
