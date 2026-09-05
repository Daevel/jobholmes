import "./globals.css";
export const metadata = {
  title: "JobHolmes",
  description: "Track applications, monitor your funnel and understand what is actually working.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
