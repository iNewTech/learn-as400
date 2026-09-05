import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'learn-as400 | IBM i (AS400) learning guide',
  description:
    'A topic-by-topic IBM i and AS400 learning guide with 200 detailed answers, 24 common issue fixes, 44 RPGLE and CL coding labs, official IBM references, and interactive quizzes.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="google-site-verification"
          content="qxzDHGclk4BtmlFhb5h2mWqjMFaixzvxxUU0rKrIj3I"
        />
      </head>
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
