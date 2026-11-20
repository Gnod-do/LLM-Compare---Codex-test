import { useEffect, useMemo, useRef, useState } from 'react';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import python from 'highlight.js/lib/languages/python';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import { Icon } from '../components/Icon';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('python', python);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);

export function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  const language = lang.split(/\s/)[0].toLowerCase();
  // highlight.js escapes every character of the source, so its HTML output is safe to inject.
  // This is the only place LLM content reaches innerHTML.
  const html = useMemo(
    () => (language && hljs.getLanguage(language) ? hljs.highlight(code, { language }).value : null),
    [code, language],
  );

  const copy = () => {
    void navigator.clipboard?.writeText(code);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="md-code">
      <div className="md-code__head">
        <span>{language || 'text'}</span>
        <button type="button" className="md-code__copy" onClick={copy}>
          <Icon name="copy" size={14} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre>
        {html != null ? <code dangerouslySetInnerHTML={{ __html: html }} /> : <code>{code}</code>}
      </pre>
    </div>
  );
}
