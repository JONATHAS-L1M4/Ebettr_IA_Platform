
import React, { useEffect } from 'react';

export const GoogleAnalytics: React.FC = () => {
  const gaId = (import.meta as any).env?.VITE_GA_ID;

  useEffect(() => {
    if (!gaId) return;

    // Add script tag for gtag.js
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    // Add inline script for gtag configuration
    const inlineScript = document.createElement('script');
    inlineScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    `;
    document.head.appendChild(inlineScript);

    return () => {
      // Cleanup if needed (though usually GA scripts stay)
      document.head.removeChild(script);
      document.head.removeChild(inlineScript);
    };
  }, [gaId]);

  return null;
};
