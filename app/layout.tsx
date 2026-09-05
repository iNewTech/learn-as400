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
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","ydjtfhzlxj");`,
          }}
        />
      </body>
    </html>
  );
}
