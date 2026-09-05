import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'learn-as400 · IBM i interview preparation',
  description:
    'A topic-by-topic IBM i developer study guide with detailed interview answers and interactive quizzes.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
