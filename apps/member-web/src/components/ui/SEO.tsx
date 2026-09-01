import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
}

const DEFAULT_TITLE = 'Safivra — Personal Financial Management';
const DEFAULT_DESC = 'Manage accounts, expenses, credit cards, loans, savings and financial goals from one secure financial system.';

export const SEO: React.FC<SEOProps> = ({ title, description }) => {
  useEffect(() => {
    // Set title
    document.title = title ? `${title} | Safivra` : DEFAULT_TITLE;

    // Set meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description || DEFAULT_DESC);
  }, [title, description]);

  return null;
};
