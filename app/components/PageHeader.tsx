"use client";
import Image from "next/image";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="teams-header">
      <div className="teams-header-inner">
        <Image
          src="/logo.png"
          alt="App Logo"
          width={100}
          height={100}
          className="teams-header-logo"
        />
        <h1 className="teams-header-title">{title}</h1>
        {subtitle && <p className="teams-header-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}
