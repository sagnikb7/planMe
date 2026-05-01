import './tag-input.css';
import { useRef, useState } from 'react';
import { TAG_MAX_LENGTH, MAX_TAGS } from '@/lib/constants';

export function TagInput({ value = [], onChange, disabled, placeholder = 'Add tag…' }) {
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef(null);
  const atLimit = value.length >= MAX_TAGS;

  const commit = () => {
    const tag = inputVal.trim().toLowerCase().replace(/,/g, '');
    if (!tag || tag.length > TAG_MAX_LENGTH || value.includes(tag) || atLimit) {
      setInputVal('');
      return;
    }
    onChange([...value, tag]);
    setInputVal('');
  };

  const remove = (tag) => onChange(value.filter((t) => t !== tag));

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && inputVal === '' && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div
      className="tag-input-wrap"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag) => (
        <span key={tag} className="tag-chip">
          {tag}
          {!disabled && (
            <button
              type="button"
              className="tag-chip-remove"
              onClick={(e) => { e.stopPropagation(); remove(tag); }}
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          )}
        </span>
      ))}
      {!disabled && !atLimit && (
        <input
          ref={inputRef}
          className="tag-input-field"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          placeholder={value.length === 0 ? placeholder : ''}
        />
      )}
      {!disabled && (
        <span className="tag-input-count" aria-live="polite">
          {value.length}/{MAX_TAGS}
        </span>
      )}
    </div>
  );
}
