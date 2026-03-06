'use client';

import { ShieldCheck } from 'lucide-react';

export default function Header({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <ShieldCheck size={20} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
    </header>
  );
}
