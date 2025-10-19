import './globals.css';
import React from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="icon" href="/square-logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/square-logo.svg" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
} 
